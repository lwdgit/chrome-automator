const runner = require('./index')
async function start () {
  const urls = ['https://baidu.com', 'https://google.com']
  for (let url of urls) {
    console.log(await runner(url, { injectScript: 'location.href' }))
  }
}
start()
