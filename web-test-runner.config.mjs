export default {
  files: ['test/*.test.js'],
  nodeResolve: true,
  testFramework: {
    path: 'framework.js'
  },
  testRunnerHtml: testFramework => `
    <!DOCTYPE html>
    <link rel="shortcut icon" type="image/png" href="jasmine-standalone/lib/jasmine-3.7.1/jasmine_favicon.png">
    <link rel="stylesheet" type="text/css" href="jasmine-standalone/lib/jasmine-3.7.1/jasmine.css">
    
    <script type="text/javascript" src="jasmine-standalone/lib/jasmine-3.7.1/jasmine.js"></script>
    <script type="text/javascript" src="jasmine-standalone/lib/jasmine-3.7.1/jasmine-html.js"></script>

    <script type="module" src="${testFramework}"></script>
  `.split('\n').map(line => line.trim()).filter(line => line).join('\n')
}