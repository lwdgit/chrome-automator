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
 - [x] cookies
    - [x] set
    - [x] get
    - [x] clear
 
 - [x] inject
 - [x] on 暂时支持的事件与Nightmare不同
 <details>
 <summary>列表如下: 详细说明见 https://chromedevtools.github.io/devtools-protocol/tot/Network/#event-loadingFailed </summary>
    
  - [x] Network.resourceChangedPriority
  - [x] Network.requestWillBeSent
  - [x] Network.requestServedFromCache
  - [x] Network.responseReceived
  - [x] Network.dataReceived
  - [x] Network.loadingFinished
  - [x] Network.loadingFailed
  - [x] Network.webSocketWillSendHandshakeRequest
  - [x] Network.webSocketHandshakeResponseReceived
  - [x] Network.webSocketCreated
  - [x] Network.webSocketClosed
  - [x] Network.webSocketFrameReceived
  - [x] Network.webSocketFrameError
  - [x] Network.webSocketFrameSent
  - [x] Network.eventSourceMessageReceived
  - [x] Network.requestIntercepted

 > 如想取消监听，可以 `return { cancled: true }` 继续接下来的流程。例子见 [test4](./tests/test4.js)
 </details>
 
 - once 只监听一次，监听完成后可以继续后续的动作

 - [ ] halt 暂时不支持，chrome在此场景不太适用 https://github.com/segmentio/nightmare/issues/835
 - [ ] header 目前可以使用setExtraHTTPHeaders代替部分功能
 

拓展功能及API:

 - [x] iframe 进入iframe，方便iframe里面的操作
 - [x] pipe 支持流程衔接，如登录流程，和 then 一样，pipe 也可以接收上个流程的返回值，建议在中间流程使用 pipe 替代 then
 - [x] 支持新窗口打开时自动跟踪，防控制跳失 注: headless模式下存在bug
 - [x] setExtraHTTPHeaders
 - [x] ignoreSWCache 忽略service worker缓存

> PS：目前原有框架(Nightmare)回调写法全部去除，仅保留 Promise 写法。

> Tips: 执行过程中手动进行某些操作（如打开开发者工具）可能会使用动作失效。
> 因为 Promise 无法取消的原因，所以在流程执行完 end 操作后node可能并不会立即退出，一般会在 30s 左右自动退出，可以缩短 loadTimeout 和 executionTimeout 解决
> Promise 异步流程目前在node下还无法显示完整的错误堆栈信息，可以考虑使用 node --trace-warings 查看，也可以使用 `global.Promise = require('bluebird')`解决，使用过程中记得使用 try catch 包裹执行段

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
