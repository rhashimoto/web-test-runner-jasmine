export default {
  files: ['test/*.test.js'],
  nodeResolve: true,

  testFramework: {
    path: 'jasmine-framework.js',
    config: {
      standalone: 'jasmine-standalone/lib/jasmine-3.7.1'
    }
  }
}