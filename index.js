import path from 'path';
import { createRequire } from 'module';

// Get relative path to framework module.
const require = createRequire(import.meta.url);
const frameworkPath =
  path.dirname(path.relative('.', require.resolve('web-test-runner-jasmine/package.json')));

export default {
  path: `${frameworkPath}/jasmine-framework.js`,
  config: {
    standalone: `${frameworkPath}/jasmine-standalone/lib/current`
  }  
};