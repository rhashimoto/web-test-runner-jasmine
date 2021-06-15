import { createRequire } from 'module';
import path from 'path'

const require = createRequire(import.meta.url);

export default {
  files: ['test/*.test.js', 'test/*.test.html'],
  nodeResolve: true,

  testFramework: {
    path: path.relative('.', require.resolve('web-test-runner-jasmine'))
  }
}