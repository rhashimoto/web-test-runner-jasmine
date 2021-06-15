const getJasmineFramework = require('web-test-runner-jasmine');

module.exports = {
  files: ['test/*.test.js'],
  nodeResolve: true,

  testFramework: getJasmineFramework('.')
}