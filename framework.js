import {
  getConfig,
  sessionStarted,
  sessionFinished,
  sessionFailed,
} from '@web/test-runner-core/browser/session.js';

(async () => {
  try {
    sessionStarted();

    const { testFile, testFrameworkConfig } = await getConfig();
    const events = await runJasmineTests(new URL(testFile, document.baseURI).href);

    let suite = { suites: [], tests: [] };
    const suiteStack = [suite];
    for (const event of events) {
      switch (event.type) {
        case 'suiteStarted':
          const suite = {
            name: event.data.description,
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
            name: event.data.description,
            passed: event.data.status === 'passed',
            skipped: event.data.status === 'excluded',
            error: event.data.failedExpectations[0]
          });
          break;
        default:
          break;
      }
    }

    function didSuitePass(suite) {
      return suite.tests.every(test => test.passed) &&
             suite.suites.every(didSuitePass);
    }

    sessionFinished({
      passed: didSuitePass(suiteStack[0]),
      testResults: suiteStack[0],
    });
  } catch (error) {
    sessionFailed(error);
    return;
  }
})();

async function runJasmineTests(url) {
  const jasmineRequire = window.jasmineRequire;
  const jasmine = jasmineRequire.core(jasmineRequire);
  const global = jasmine.getGlobal();

  jasmineRequire.html(jasmine);

  const env = jasmine.getEnv();
  var jasmineInterface = jasmineRequire.interface(jasmine, env);
  Object.assign(global, jasmineInterface);

  // Collect Jasmine events.
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

  // Import the test code.
  await import(url);

  const queryString = new jasmine.QueryString({
    getWindowLocation: function() { return window.location; }
  });

  const filterSpecs = !!queryString.getParam("spec");

  const config = {
    failFast: queryString.getParam("failFast"),
    oneFailurePerSpec: queryString.getParam("oneFailurePerSpec"),
    hideDisabled: queryString.getParam("hideDisabled")
  };

  const random = queryString.getParam("random");
  if (random !== undefined && random !== "") {
    config.random = random;
  }

  const seed = queryString.getParam("seed");
  if (seed) {
    config.seed = seed;
  }

  /**
   * ## Reporters
   * The `HtmlReporter` builds all of the HTML UI for the runner page. This reporter paints the dots, stars, and x's for specs, as well as all spec names and all failures (if any).
   */
  const htmlReporter = new jasmine.HtmlReporter({
    env,
    navigateWithNewParam: function(key, value) { return queryString.navigateWithNewParam(key, value); },
    addToExistingQueryString: function(key, value) { return queryString.fullStringWithNewParam(key, value); },
    getContainer: function() { return document.body; },
    createElement: function() { return document.createElement.apply(document, arguments); },
    createTextNode: function() { return document.createTextNode.apply(document, arguments); },
    timer: new jasmine.Timer(),
    filterSpecs
  });
  env.addReporter(htmlReporter);

  /**
   * Filter which specs will be run by matching the start of the full name against the `spec` query param.
   */
  var specFilter = new jasmine.HtmlSpecFilter({
    filterString: function() { return queryString.getParam("spec"); }
  });

  config.specFilter = function(spec) {
    return specFilter.matches(spec.getFullName());
  };

  env.configure(config);

  /**
   * Setting up timing functions to be able to be overridden. Certain browsers (Safari, IE 8, phantomjs) require this hack.
   */
  window.setTimeout = window.setTimeout;
  window.setInterval = window.setInterval;
  window.clearTimeout = window.clearTimeout;
  window.clearInterval = window.clearInterval;

  /**
   * ## Execution
   */
  htmlReporter.initialize();
  env.execute();

  return await events;
}