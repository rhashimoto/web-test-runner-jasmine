# web-test-runner-jasmine
This is a test framework for [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) that uses the [Jasmine](https://jasmine.github.io/index.html) standalone browser runner and assertion library (instead of Mocha+Chai).

To use it, install as a dev dependency and configure:

```javascript
// web-test-runner-config.mjs
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
```

Javascript test files should be written as ordinary Jasmine tests in an ES6 module. HTML test files should look something like this:

```html
<!DOCTYPE html>
<body>
  <!-- Add markup for testing -->
  <h1>hello, world</h1>
  <script type="module">
    import runTests from 'web-test-runner-jasmine/runTests.js';
    runTests(() => {
      describe('foo', function() {
        it('tests something', async function() {
          expect(true).toBeTruthy();
        });
      });
    });
  </script>
</body>
```
