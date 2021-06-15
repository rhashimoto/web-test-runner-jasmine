const getJasmineFramework = require('web-test-runner-jasmine');

module.exports = {
  files: ['test/*.test.js', 'test/*.test.html'],
  nodeResolve: true,

  testFramework: getJasmineFramework('.')
}