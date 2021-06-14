import path from 'path';
import { createRequire } from 'module';

// Get relative path to framework module.
const require = createRequire(import.meta.url);
const frameworkPath = path.dirname(path.relative('.', require.resolve('test-runner-expect/package.json')));

export default {
  files: ['test/*.test.js'],
  nodeResolve: true,

  testFramework: {
    path: `${frameworkPath}/jasmine-framework.js`,
    config: {
      standalone: `${frameworkPath}/jasmine-standalone/lib/current`
    }
  }
}