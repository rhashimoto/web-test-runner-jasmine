import getJasmineFramework from './index.js';

new console.Console(process.stdout).debug(getJasmineFramework(process.cwd()));

export default {
  files: ['test/*.test.js'],
  nodeResolve: true,

  testFramework: getJasmineFramework('.')
}