const path = require('path');

module.exports = {
  files: ['test/*.test.js', 'test/*.test.html'],
  nodeResolve: true,

  testFramework: {
    path: path.relative('.', require.resolve('web-test-runner-jasmine'))
  }
}