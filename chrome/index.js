const launch = require('./launch')
const CDP = require('chrome-remote-interface')
const flow = require('myflow')

let chrome = {
  client: [],
  host: null
}
module.exports = function (opts) {
  return flow(async function () {
    if (!chrome.host) {
      chrome.host = chrome.client = await CDP({
        port: (await launch.launch(opts)).port
      })
      chrome.client.kill = launch.close
      chrome.client.Network.enable()
      chrome.client.Page.enable()

      /**
       * Auto attach to new window when pop up
       * https://github.com/cyrus-and/chrome-remote-interface/issues/130
       */
      let Target = chrome.client.Target
      Target.setDiscoverTargets({discover: true})
      Target.targetCreated(async (params) => {
        if (params.targetInfo.type !== 'other') {
          return
        }

        const {targetId} = params.targetInfo
        const findTarget = (targets) => {
          return targets.find(target => target.id === targetId)
        }
        chrome.client = await CDP({target: findTarget})
      })

      return new Promise(resolve => {
        chrome.client.once('ready', resolve.bind(null, chrome))
      })
    }
    return chrome
  })
  .run()
}
