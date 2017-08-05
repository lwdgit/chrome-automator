const chrome = require('..')

chrome.action('log', function (msg) {
  console.log(msg)
})
try {
  chrome({ show: true })
  .goto('https://baidu.com')
  .wait('body')
  .log('inject css')
  .inject('css', 'fixtures/inject.css')
  .screenshot('fixtures/2.png')
  .wait(3000)
  .log('inject js')
  .inject('js', 'fixtures/inject.js')
  .screenshot('fixtures/2.jpg')
  .log('get title')
  .title()
  .end()
  .then((title) => console.log(title))
} catch (e) {
  console.log(e)
}
