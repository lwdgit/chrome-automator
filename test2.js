const chrome = require('.')

chrome.action('log', function (msg) {
  console.log(msg)
})
try {
  chrome({ show: true })
  .goto('https://baidu.com')
  .wait('body')
  .log('inject css')
  .inject('css', 'test/inject.css')
  .wait(3000)
  .log('inject js')
  .inject('js', 'test/inject.js')
  .log('get title')
  .title()
  .then((title) => console.log(title))
} catch (e) {
  console.log(e)
}
