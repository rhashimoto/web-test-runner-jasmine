import {
  sessionStarted,
  sessionFinished,
  sessionFailed,
} from '@web/test-runner-core/browser/session.js';

const JASMINE_VERSION = '4.5.0';
const STANDALONE_PATH = new URL(`./jasmine-standalone/lib/jasmine-${JASMINE_VERSION}`, import.meta.url).href;

const PREPARE_TIMEOUT = 10000;

let bootFunction;

/**
 * @param {() => Promise<void>|void} specs 
 * @param {object} config?
 */
export default async function(specs, config = {}) {
  try {
    sessionStarted();
    await Promise.race([
      prepareJasmine(),
      new Promise((_, reject) => setTimeout(() => {
        reject(new Error('Jasmine standalone loading failed'));
      }, PREPARE_TIMEOUT))
    ]);
    const events = await getJasmineEvents(specs, config);
    const results = convertEventsToResults(events);
    sessionFinished(results);
  } catch(e) {
    sessionFailed(e);
  }
}

async function prepareJasmine() {
  // Load Jasmine standalone assets.
  const html = new DOMParser().parseFromString(`
    <link rel="shortcut icon" type="image/png" href="${STANDALONE_PATH}/jasmine_favicon.png">
    <link rel="stylesheet" type="text/css" href="${STANDALONE_PATH}/jasmine.css" crossorigin="anonymous">
    
    <script type="text/javascript" src="${STANDALONE_PATH}/jasmine.js"></script>
    <script type="text/javascript" src="${STANDALONE_PATH}/jasmine-html.js"></script>
  `, 'text/html');

  const scriptLoad = [];
  Array.from(html.querySelectorAll('link, script')).map(element => {
    if (element.tagName.match(/^script$/i)) {
      // Script elements created by DOMParser are not executable so
      // add a copy to the document.
      const script = document.createElement('script');
      script.type = element.type;
      script.src = element.src;
      script.async = false;
      scriptLoad.push(new Promise(resolve => script.onload = resolve));
      return script;
    }
    return element;
  }).forEach(element => {
    document.head.appendChild(element);
  });
  await Promise.all(scriptLoad);

  // Wait for the window load event before loading the Jasmine boot script
  // so test execution is not triggered prematurely.
  if (document.readyState !== 'complete') {
    await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  } else {
    await new Promise(resolve => setTimeout(resolve));
  }
  window.onload = null;

  // Boot Jasmine.
  const bootScripts = ['boot0.js', 'boot1.js'].map(name  => {
    const bootScript = document.createElement('script');
    bootScript.src = `${STANDALONE_PATH}/${name}`;
    bootScript.async = false;
    document.head.appendChild(bootScript);
    return new Promise(resolve => bootScript.onload = resolve)
  });
  await Promise.all(bootScripts);

  bootFunction = window.onload;
}

/**
 * @param {() => Promise<void>|void} specs 
 * @param {object} config
 */
async function getJasmineEvents(specs, config) {
  // Instantiate the tests.
  await specs();

  // Prepare to collect Jasmine events.
  const events = new Promise(resolve => {
    const events = [];
    const reporter = {};
    [ "jasmineStarted", "jasmineDone",
      "suiteStarted",   "suiteDone",
      "specStarted",    "specDone" ].forEach(function(type) {
        reporter[type] = function(data) {
          events.push({ type, data });
          if (type === 'jasmineDone') resolve(events);
        };
      });
    jasmine.getEnv().addReporter(reporter);
  });

  // Trigger test execution.
  bootFunction();
  return events;
}

function convertEventsToResults(events) {
  const suiteStack = [{ suites: [], tests: [] }];
  for (const { type, data } of events) {
    switch (type) {
      case 'suiteStarted':
        const suite = {
          name: data.description,
          suites: [],
          tests: []
        };
        suiteStack[suiteStack.length - 1].suites.push(suite);
        suiteStack.push(suite);
        break;
      case 'suiteDone':
        suiteStack.pop();
        break;
      case 'specDone':
        suiteStack[suiteStack.length - 1].tests.push({
          name: data.description,
          passed: data.status === 'passed',
          skipped: data.status === 'excluded',
          error: summarizeErrors(data.failedExpectations)
        });
        break;
      default:
        break;
    }
  }

  function didSuitePass(suite) {
    return suite.tests.every(test => test.passed || test.skipped) &&
           suite.suites.every(didSuitePass);
  }

  return {
    passed: didSuitePass(suiteStack[0]),
    testResults: suiteStack[0],
  };
}

function summarizeErrors(errors) {
  if (!errors?.length) return undefined;

  const summary = {...errors[0]};
  if (errors.length > 1) {
    errors.forEach((error, i) => {
      summary.message =
        (i ? summary.message + '\n' : '') +
        `(${i + 1}/${errors.length}) ${error.message}`;
    })
  }
  return summary;
}
