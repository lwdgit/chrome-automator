const launch = require('./launch')
const chrome = require('chrome-remote-interface')
const flow = require('myflow')
// const debug = require('debug')('chrome-interface')
// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// function listenError () {
//   return new Promise((resolve, reject) => {
//     window.addEventListener('error', function ({error}) {
//       resolve([
//         error.message,
//         error.stack
//       ].join('\n'))
//     })
//   })
// }

// /* Generate an IIEF string invoking `fn` */
// function generateExpression (fn, awaitPromise) {
//   return {
//     expression: '(' + fn.toString() + ')()',
//     awaitPromise
//   }
// }

// function collectError (client) {
//   return new Promise((resolve, reject) => {
//     client.once('Network.responseReceived', function () {
//       client.Runtime.evaluate({
//         expression: `(${listenError})()`,
//         awaitPromise: true
//       })
//       .then(function (ret) {
//         debug(ret)
//         resolve(((ret || {}).result || {}).value)
//       }).catch(reject)
//     })
//   })
// }

// function collectPageInfo (client, injectScript) {
//   return new Promise((resolve, reject) => {
//     client.once('Page.frameStoppedLoading', function () {
//       client.Runtime.evaluate(generateExpression(injectScript, true))
//       .then(function ({ result }) {
//         debug(result)
//         resolve(result.value)
//       }).catch(reject)
//     })
//   })
// }

// async function collectInfo (client, injectScript, timeout) {
//   const errorListener = collectError(client)
//   const pageInfo = collectPageInfo(client, injectScript)
//   try {
//     let result = await Promise.race([pageInfo, sleep(timeout)])
//     let error = await Promise.race([errorListener, sleep(3000)])
//     return { error, result }
//   } catch (e) {
//     return { error: e }
//   }
// }

// const defaultScript = async function () {
//   return '请注入要想要执行的代码'
// }

let client
module.exports = function (opts) {
  return flow(async function () {
    if (!client) {
      client = await chrome({
        port: (await launch.launch(opts)).port
      })
      client.kill = launch.close
      client.ServiceWorker.disable()
      client.Network.enable()
      client.Page.enable()
      return new Promise(resolve => {
        client.once('ready', resolve.bind(null, client))
      })
    }
    return client
  })
  // 暂时屏蔽掉错误监听
  // .pipe(async function (client) {
  //   await client.Page.navigate({ url })
  //   let { error, result } = (await collectInfo(client, injectScript, timeout)) || {}
  //   return { error, result }
  // })
  .run()
}
