const chrome = require('..')

chrome.action('log', function (msg) {
  console.log(msg)
})
try {
  chrome({ show: true })
  .goto('https://baidu.com')
  .wait('body')
  .insert('input#kw', 'hello world\r')
  .log('start set cookie')
  .wait(3000)
  .log('测试写入cookie')
  .cookies.set('test_set_cookie', '>> This is a coookie info')
  .cookies.get('test_set_cookie')
  .pipe((cookie) => console.log(cookie))
  .log('测试清除单条cookie')
  .cookies.clear(['test_set_cookie'])
  .cookies.get('test_set_cookie')
  .pipe((cookie) => console.log(cookie))
  .log('测试清除所有cookie')
  .cookies.clear()
  .cookies.get()
  .pipe((cookies) => console.log(cookies.length))
} catch (e) {
  console.log(e)
}
