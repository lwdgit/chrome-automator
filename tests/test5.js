const chrome = require('..')

chrome.action('log', function (msg) {
  console.log(msg)
})
try {
  chrome({ show: true, loadTimeout: 0 })
  .on('Console.messageAdded', function ({ message }) {
    console.log('Runtime.messageAdded', arguments)
  })
  .on('Runtime.consoleAPICalled', function ({ type, args }) {
    console.log('Runtime.consoleAPICalled', type, args)
  })
  .goto('https://baidu.com')
  .log('check js alert')
  .end()
} catch (e) {
  console.log(e)
}
