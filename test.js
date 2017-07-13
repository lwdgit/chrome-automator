const chrome = require('.')

chrome()
.goto('https://www.baidu.com/')
.insert('input#kw', 'hello world\r')
.wait('.c-container a')
.evaluate(() => document.querySelector('.c-container a').href)
.then(function(url) {
  console.log(url)
  return chrome().goto(url)
})
.wait('[id^="highlighter_"]')
.evaluate(async function() {
  return document.querySelectorAll('.para-title.level-3')[9].nextElementSibling.querySelector('.code').textContent
})
.then((code) => console.log(code))

