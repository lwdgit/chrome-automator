const { launchWithoutNoise } = require('./starter/index.js')
let launcher

exports.launch = async function (opts = {}) {
  if (!launcher) {
    launcher = await launchWithoutNoise(Object.assign({
      //port: 9222,
      // autoSelectChrome: true,
      // chromePath: __dirname + '/chrome.sh',
      // chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      chromeFlags: [
        '--debug-devtools',
        '--no-sandbox',
        '--remote-debugging-address=0.0.0.0',
        '--window-size=1000,732',
        '--disable-web-security',
        '--allow-file-access-from-files',
        '--allow-file-access',
        '--allow-cross-origin-auth-prompt',
        '--disable-gpu',
        '--v8-cache-strategies-for-cache-storage', // 禁用service worker
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
