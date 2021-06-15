const assert = require('assert');
const path = require('path');
const modulePath =
  path.dirname(require.resolve('web-test-runner-jasmine/package.json'));

function makePath(root, filename) {
  return path.relative(root, path.resolve(modulePath, filename));
}

module.exports = function getJasmineFramework(serverRoot) {
  assert.strictEqual(typeof serverRoot, 'string', 'string argument expected');
  return {
    path: makePath(process.cwd(), 'jasmine-framework.js'),
    config: {
      standalone: makePath(serverRoot, 'jasmine-standalone/lib/current')
    }  
  };
}