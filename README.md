# chrome-automator

基于 chrome-remote-interface 的自动爬虫。

Api与 [Nightmare](https://github.com/segmentio/nightmare) 保持高度兼容。

## API兼容列表如下: （暂时不支持的正在加紧支持中）

 - [x] constructor 目前仅支持 port 与 show设置
 - [x] goto
 - [x] url
 - [x] title
 - [x] action
 - [x] evaluate
 - [x] click
 - [x] type
 - [x] insert
 - [x] wait
 - [x] mouseup
 - [x] mouseover
 - [x] mousedown
 - [x] check
 - [x] uncheck
 - [x] select
 - [x] scrollTo
 - [x] visible
 - [x] exists
 - [x] path
 - [x] back
 - [x] forward
 - [x] refresh
 - [x] end
 - [x] focusSelector
 - [x] blurSelector
 - [ ] pdf
 - [ ] screenshot
 - [ ] html
 - [ ] userAgent
 - [ ] authentication
 - [ ] halt
 - [ ] on
 - [ ] viewport
 - [ ] inject
 - [ ] header
 - [ ] cookies


## Examples:

```javascript
const chrome = require('chrome-automator')

chrome({ show: false })
.goto('https://www.baidu.com/')
.wait('body')
.insert('input#kw', 'hello world\r')
.wait('.c-container a')
.evaluate(() => document.querySelector('.c-container a').href)
.then(function (url) {
  console.log(url)
  return chrome().goto(url)
})
.wait('[id^="highlighter_"]')
.evaluate(() => document.querySelectorAll('.para-title.level-3')[9].nextElementSibling.querySelector('.code').textContent)
.then((code) => console.log(code))
```

```javascript
var Nightmare = require('chrome-automator')
Nightmare.action('hello', function () {
  console.log('Get url')
  return this.evaluate_now(function () {
    return document.querySelector('#links_wrapper a.result__a').href
  })
})

var nightmare = Nightmare({ show: true })
try {
  nightmare
  .goto('https://duckduckgo.com')
  .type('#search_form_input_homepage', 'github nightmare')
  .click('#search_button_homepage')
  .wait('#zero_click_wrapper .c-info__title a')
  .hello()
  .end()
  .then(function (result) {
    console.log(result)
  })
} catch (e) {
  console.log(e)
}

```

## LICENSE

MIT

## 感谢
 
 * Nightmare
 * chrome-remote-interface
 * lighthouse