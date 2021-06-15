import runTests from './runTests.js';
import { getConfig } from '@web/test-runner-core/browser/session.js';

(async () => {
  const { testFile, testFrameworkConfig } = await getConfig();

  await runTests(async function() {
    const url = new URL(testFile, document.baseURI).href;
    await import(url);
  }, testFrameworkConfig);
})();