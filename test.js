const chrome = require('.')
try {
  chrome({ show: false })
  .viewport(40, 100)
  .useragent('Mozilla/5.0 Chrome/59.0.3071.115 Mobile Safari/537.36')
  .goto('https://www.baidu.com/')
  .wait('body')
  .screenshot('1.jpg')
  .html('1.html')
  .insert('input#kw', 'hello world\r')
  .wait('.c-container a')
  .evaluate(() => document.querySelector('.c-container a').href)
  .then(function (url) {
    console.log(url)
    return chrome().goto(url)
  })
  .wait('[id^="highlighter_"]')
  .pdf('2.pdf')
  .evaluate(() => document.querySelectorAll('.para-title.level-3')[9].nextElementSibling.querySelector('.code').textContent)
  .then((code) => console.log(code))
} catch (e) {
  console.log(e)
}
