# chrome-automator

基于 chrome-remote-interface 的自动爬虫。

API与 [Nightmare](https://github.com/segmentio/nightmare) 保持高度兼容。

## API兼容列表如下: （暂时不支持的正在加紧支持中）

 - [x] constructor 支持如下参数
    - [x] port
    - [x] show
    - [x] chromePath
    - [x] waitTimeout
    - [x] executionTimeout
    - [x] loadTimeout
    
 - [x] goto
 - [x] url
 - [x] title
 - [x] action 只支持 Promise 和 async 方式的异步写法，不支持 callback 方式
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
 - [x] pdf 仅支持headless模式，设置 show: false 开启
 - [x] screenshot
 - [x] viewport
 - [x] useragent
 - [x] html
 - [x] authentication
 - [x] cookies 分拆为 setCookie getCookie 和 clearCookie 三个功能替代，clearCookie 支持清除指定key的cookie
 - [x] inject 开发中，还有bug
 - [ ] halt
 - [ ] on
 - [ ] header 目前可以使用setExtraHTTPHeaders代替部分功能
 

拓展功能及API:

 - [x] iframe 进入iframe，方便iframe里面的操作
 - [x] pipe 支持流程衔接，如登录流程
 - [x] 支持新窗口打开时自动跟踪，防控制跳失 注: headless模式下存在bug
 - [x] setExtraHTTPHeaders
 - [x] ignoreSWCache 忽略servie worker缓存

> PS：目前原有框架(Nightmare)回调写法全部去除，仅保留 Promise 写法。

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