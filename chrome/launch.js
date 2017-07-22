// const { launch } = require('./starter/index.js')
const { launch } = require('lighthouse/chrome-launcher')
let launcher

exports.launch = async function (opts = {}) {
  if (!launcher) {
    launcher = await launch(Object.assign({
      // port: 9222,
      // autoSelectChrome: true,
      // chromePath: __dirname + '/chrome.sh',
      // chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      chromeFlags: [
        '--debug-devtools',
        '--no-sandbox',
        '--remote-debugging-address=0.0.0.0',
        // '--window-size=1000,732',
        '--disable-web-security',
        '--allow-file-access-from-files',
        '--allow-file-access',
        '--allow-cross-origin-auth-prompt',
        '--disable-gpu',
        '--v8-cache-strategies-for-cache-storage', // 禁用service worker
        // Disable built-in Google Translate service
        '--disable-translate',
        // Disable all chrome extensions entirely
        '--disable-extensions',
        // Disable various background network services, including extension updating,
        // safe browsing service, upgrade detector, translate, UMA
        '--disable-background-networking',
        // Disable fetching safebrowsing lists, likely redundant due to disable-background-networking
        '--safebrowsing-disable-auto-update',
        // Disable syncing to a Google account
        '--disable-sync',
        // Disable reporting to UMA, but allows for collection
        '--metrics-recording-only',
        // Disable installation of default apps on first run
        '--disable-default-apps'
        // '--headless'
      ]
    }, opts))
  }
  return launcher
}

exports.close = function () {
  if (launcher) {
    launcher.kill()
    launcher = null
  }
}

function exitHandler (options, err) {
  // console.log('detect exit')
  exports.close()
  // if (err) console.log(err.stack)
  process.exit()
}

// do something when app is closing
process.on('exit', exitHandler)

// catches ctrl+c event
process.on('SIGINT', exitHandler)

// catches uncaught exceptions
process.on('uncaughtException', exitHandler)
