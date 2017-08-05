const chrome = require('..')

chrome.action('log', function (msg) {
  console.log(msg)
})
try {
  chrome({ show: true, loadTimeout: 0 })
  .goto('https://baidu.com')
  .once('Network.loadingFinished', function () {
    console.log('loaded')
  })
  .insert('input#kw', 'hello world\r')
  .log('start set cookie')
  .on('Network.loadingFinished', function () {
    console.log('loaded')
    return {
      canceled: true
    }
  })
  .url()
  .pipe((url) => console.log(url))
  .end()
} catch (e) {
  console.log(e)
}
