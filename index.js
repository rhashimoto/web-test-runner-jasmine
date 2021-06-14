import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const modulePath =
  path.dirname(require.resolve('web-test-runner-jasmine/package.json'));

function makePath(root, filename) {
  return path.relative(root, path.resolve(modulePath, filename));
}

export default function(serverRoot = process.cwd()) {
  return {
    path: makePath(process.cwd(), 'jasmine-framework.js'),
    config: {
      standalone: makePath(serverRoot, 'jasmine-standalone/lib/current')
    }  
  };
}