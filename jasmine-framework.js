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

    const suiteStack = [{ suites: [], tests: [] }];
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
  // Initialize Jasmine.
  bootJasmine();

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

  // Load the test code.
  await import(url);

  // Trigger Jasmine execution.
  dispatchEvent(new Event('jasmine-run'));

  return await events;
}

// The contents of this function are copied from standalone Jasmine boot.js,
// and modified to change the triggering event. Normally the trigger is
// the Window "load" event but we use dynamic import to load the spec file
// so execution needs to be delayed until that is ready.
function bootJasmine() {
  var jasmineRequire = window.jasmineRequire || require('./jasmine.js');

  /**
   * ## Require &amp; Instantiate
   *
   * Require Jasmine's core files. Specifically, this requires and attaches all of Jasmine's code to the `jasmine` reference.
   */
  var jasmine = jasmineRequire.core(jasmineRequire),
    global = jasmine.getGlobal();
  global.jasmine = jasmine;

  /**
   * Since this is being run in a browser and the results should populate to an HTML page, require the HTML-specific Jasmine code, injecting the same reference.
   */
  jasmineRequire.html(jasmine);

  /**
   * Create the Jasmine environment. This is used to run all specs in a project.
   */
  var env = jasmine.getEnv();

  /**
   * ## The Global Interface
   *
   * Build up the functions that will be exposed as the Jasmine public interface. A project can customize, rename or alias any of these functions as desired, provided the implementation remains unchanged.
   */
  var jasmineInterface = jasmineRequire.interface(jasmine, env);

  /**
   * Add all of the Jasmine global/public interface to the global scope, so a project can use the public interface directly. For example, calling `describe` in specs instead of `jasmine.getEnv().describe`.
   */
  extend(global, jasmineInterface);

  /**
   * ## Runner Parameters
   *
   * More browser specific code - wrap the query string in an object and to allow for getting/setting parameters from the runner user interface.
   */

  var queryString = new jasmine.QueryString({
    getWindowLocation: function() { return window.location; }
  });

  var filterSpecs = !!queryString.getParam("spec");

  var config = {
    failFast: queryString.getParam("failFast"),
    oneFailurePerSpec: queryString.getParam("oneFailurePerSpec"),
    hideDisabled: queryString.getParam("hideDisabled")
  };

  var random = queryString.getParam("random");

  if (random !== undefined && random !== "") {
    config.random = random;
  }

  var seed = queryString.getParam("seed");
  if (seed) {
    config.seed = seed;
  }

  /**
   * ## Reporters
   * The `HtmlReporter` builds all of the HTML UI for the runner page. This reporter paints the dots, stars, and x's for specs, as well as all spec names and all failures (if any).
   */
  var htmlReporter = new jasmine.HtmlReporter({
    env: env,
    navigateWithNewParam: function(key, value) { return queryString.navigateWithNewParam(key, value); },
    addToExistingQueryString: function(key, value) { return queryString.fullStringWithNewParam(key, value); },
    getContainer: function() { return document.body; },
    createElement: function() { return document.createElement.apply(document, arguments); },
    createTextNode: function() { return document.createTextNode.apply(document, arguments); },
    timer: new jasmine.Timer(),
    filterSpecs: filterSpecs
  });

  /**
   * The `jsApiReporter` also receives spec results, and is used by any environment that needs to extract the results  from JavaScript.
   */
  env.addReporter(jasmineInterface.jsApiReporter);
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
  // Begin change to Jasmine standalone boot.js.
  window.addEventListener('jasmine-run', function() {
    htmlReporter.initialize();
    env.execute();
  });
  // End change to Jasmine standalone boot.js.

  /**
   * Helper function for readability above.
   */
  function extend(destination, source) {
    for (var property in source) destination[property] = source[property];
    return destination;
  }
}