const Chrome = require('./chrome')
const debug = require('debug')('chrome')
const jsesc = require('jsesc')
const { Flow } = require('myflow')
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const fs = require('fs')
const { extname } = require('path')

class Automator extends Flow {
  constructor (opts = {}) {
    super()
    let options = this.options = Object.assign({
      show: true,
      waitTimeout: 30000,
      executionTimeout: 30000,
      loadTimeout: 10000,
      windowSize: [ 1920, 1600 ],
      port: 9222
    }, opts)

    let flags = {
      port: options.port,
      chromePath: options.chromePath,
      chromeFlags: opts.chromeFlags || []
    }

    if (!options.show) {
      flags.chromeFlags.push('--headless')
    }

    if (options.windowSize) {
      flags.chromeFlags.push('--window-size=' + options.windowSize.join(','))
    }

    Chrome(flags)
    .then((chrome) => {
      this.chrome = chrome
      this.run()
    })
    .catch(function (e) {
      console.log(e)
    })

    const self = this

    this.cookies = {
      set (key, value) {
        return self.pipe(async function () {
          debug('.setCookie()')
          /**
           * https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setCookie
           */
          if (typeof key === 'string') {
            key = {
              name: key,
              value: value,
              path: '/'
            }
          }
          /**
           * 此方法成功率不高(50%)左右，故采用自行设置的方式
           * return self.chrome.client.Network.setCookie(Object.assign({ url }, key))
           */
          let cookies = [`${key.name}=${key.value}`]
          delete key.name
          delete key.value
          for (let k in key) {
            cookies.push(`${k}=${key[k]}`)
          }
          return this.evaluate_now(`document.cookie='${cookies.join('; ')}'`)
        })
      },
      get (key) {
        return self.pipe(async function () {
          debug('.getCookie()')
          const allCookie = (await self.chrome.client.Network.getAllCookies()).cookies
          if (key == null || key === '') {
            return allCookie
          } else {
            return (allCookie.filter((cookie) => cookie.name === key)[0] || {}).value
          }
        })
      },
      clear (keys) {
        return self.pipe(async function () {
          debug('.clearCookie()')
          if (keys == null || keys === '') {
            if (self.chrome.client.Network.canClearBrowserCookies()) {
              return self.chrome.client.Network.clearBrowserCookies()
            } else {
              return false
            }
          } else {
            if (typeof keys === 'string') {
              keys = [ keys ]
            }
            if (Array.isArray(keys)) {
              let url = await self.evaluate_now(() => window.location.href)
              return Promise.all(
                keys.map(
                  (key) => self.chrome.client.Network.deleteCookie({ cookieName: key, url })
                )
              )
            } else {
              return false
            }
          }
        })
      }
    }
  }

  goto (url, { loadTimeout = this.options.loadTimeout } = {}) {
    return this.pipe(async function () {
      await this.chrome.client.Page.navigate({ url })
      if (loadTimeout) {
        return Promise.race([ this.chrome.client.Page.frameStoppedLoading(), sleep(loadTimeout) ])
      } else {
        return this.chrome.client.Page.frameStoppedLoading()
      }
    })
  }

  waitfn (fn, ...args) {
    var timeout = this.options.waitTimeout
    var self = this
    return new Promise(async function (resolve) {
      const startTime = Date.now()
      while (Date.now() - startTime < timeout) {
        await sleep(500)
        var ret = await self.evaluate_now(fn, ...args)
        if (ret !== false) {
          break
        }
      }
      await sleep(500)
      resolve()
    })
  }

  waitSelector (selector) {
    return this.waitfn(function (selector) {
      return !!window.top._chromeCurrentWindow.document.querySelector(selector)
    }, selector)
  }

  wait (arg, timeout = 30000) {
    return this.pipe(function () {
      if (typeof arg === 'number') {
        debug('.wait() ' + arg + 'msec')
        return sleep(arg)
      } else if (typeof arg === 'string') {
        debug('.wait() for ' + arg + ' element' + (timeout ? ' or ' + timeout + 'msec' : ''))
        return this.waitSelector(arg)
      } else if (typeof arg === 'function') {
        debug('.wait() for ' + arg + ' function ' + (timeout ? ' or ' + timeout + 'msec' : ''))
        return this.waitfn(arg)
      }
    })
  }

  iframe (selector) {
    return this.pipe(function () {
      return this.evaluate_now(async function (selector) {
        try {
          window.top._chromeIframeStacks.push(window.top._chromeCurrentWindow.document.querySelector(selector))
          window.top._chromeWindowStacks.push(window.top._chromeIframeStacks[window.top._chromeIframeStacks.length - 1].contentWindow)
        } catch (e) {
          console.info('goto iframe error')
        }
      }, selector)
    })
  }

  parent () {
    return this.pipe(function () {
      return this.evaluate_now(async function (selector) {
        if (window.top._chromeWindowStacks.length > 1) {
          window.top._chromeIframeStacks.pop()
          window.top._chromeWindowStacks.pop()
        }
      })
    })
  }

  evaluate_now (fn, ...args) { // eslint-disable-line
    // console.log(`Promise.resolve((${fn.toString()})(${args.map((arg) => JSON.stringify(jsesc(arg))).join()}))`)
    let runner = this.chrome.client.Runtime.evaluate({
      expression: `
      window.top._chromeCurrentWindow = (top._chromeWindowStacks || (top._chromeWindowStacks = [window]))[top._chromeWindowStacks.length - 1];
      window.top._chromeIframeStacks = window.top._chromeIframeStacks || []
      Promise.resolve((${fn.toString()})(${args.map((arg) => JSON.stringify(jsesc(arg))).join()}))`,
      awaitPromise: true
    })
    if (this.options.executionTimeout) {
      runner = Promise.race([ runner, sleep(this.options.executionTimeout) ])
    }
    return runner.then(ret => ((ret || {}).result).value)
  }

  visible (selector) {
    return this.pipe(async function (selector) {
      debug('.visible() for ' + selector)
      return this.evaluate_now(function (selector) {
        var elem = window.top._chromeCurrentWindow.document.querySelector(selector)
        if (elem) return (elem.offsetWidth > 0 && elem.offsetHeight > 0)
        else return false
      }, selector)
    })
  }

  scrollTo (x, y) {
    return this.pipe(async function () {
      debug('.scrollTo()')
      return this.evaluate_now(function (y, x) {
        window.scrollTo(x, y)
      })
    })
  }

  exists (selector) {
    return this.pipe(async function () {
      debug('.exists() for ' + selector)
      return this.evaluate_now(function (selector) {
        return (window.top._chromeCurrentWindow.document.querySelector(selector) !== null)
      }, selector)
    })
  }

  focusSelector (selector) {
    return this.evaluate_now(function (selector) {
      window.top._chromeCurrentWindow.document.querySelector(selector).focus()
    }, selector)
  }

  blurSelector (selector) {
    return this.evaluate_now(function (selector) {
      // it is possible the element has been removed from the DOM
      // between the action and the call to blur the element
      var element = window.top._chromeCurrentWindow.document.querySelector(selector)
      if (element) {
        element.blur()
      }
    }, selector)
  }

  async findPositionInWindow (obj) {
    return (await this.evaluate_now(async function (obj, sleep) {
      if (typeof obj === 'string') {
        var expression = obj
        obj = window.top._chromeCurrentWindow.document.querySelector(expression)
        if (!obj) {
          throw new Error('cannot find an object using expression ' + expression)
        }
      }
      obj.scrollIntoViewIfNeeded()
      let rect = obj.getBoundingClientRect()
      let offsetLeft = 0
      let offsetTop = 0
      for (let w, i = 0; w = window.top._chromeIframeStacks[i++];) { // eslint-disable-line
        let r = w.getBoundingClientRect()
        offsetLeft += r.left
        offsetTop += r.top
      }
      return [ rect.left + rect.width / 2 + offsetLeft, rect.top + rect.height / 2 + offsetTop ].join()
    }, obj, sleep)) || '-1,-1'
  }

  _touch (client, x, y) {
    const options = {
      touchPoints: [{
        x: x,
        y: y,
        state: 'touchPressed'
      }]
    }

    options.type = 'touchStart'
    client.Input.dispatchTouchEvent(options)

    options.touchPoints[0].state = 'touchReleased'
    options.type = 'touchEnd'
    client.Input.dispatchTouchEvent(options)
  }

  _click (client, x, y) {
    const options = {
      x: x,
      y: y,
      button: 'left',
      clickCount: 1
    }

    options.type = 'mousePressed'
    client.Input.dispatchMouseEvent(options)

    options.type = 'mouseReleased'
    client.Input.dispatchMouseEvent(options)
  }

  async sendKey (char) {
    await this.chrome.client.Input.dispatchKeyEvent({
      'modifiers': 0,
      'nativeVirtualKeyCode': 55,
      'text': '',
      'type': 'rawKeyDown',
      'unmodifiedText': '',
      'windowsVirtualKeyCode': 55
    })
    await this.chrome.client.Input.dispatchKeyEvent({
      'modifiers': 0,
      'nativeVirtualKeyCode': 0,
      'text': char,
      'type': 'char',
      'unmodifiedText': char,
      'isKeypad': true,
      'windowsVirtualKeyCode': 0
    })
    await this.chrome.client.Input.dispatchKeyEvent({
      'modifiers': 0,
      'nativeVirtualKeyCode': 55,
      'text': '',
      'type': 'keyUp',
      'unmodifiedText': '',
      'windowsVirtualKeyCode': 55
    })
  }

  type (selector, text) {
    return this.pipe(async function () {
      debug('.type() %s into %s', text, selector)
      await this.waitSelector(selector)
      await this._clickSelector(selector)
      if ((text || '') === '') {
        await this.evaluate_now(async function (selector) {
          window.top._chromeCurrentWindow.document.querySelector(selector).value = ''
        }, selector)
      } else {
        await this.evaluate_now(async function (selector, text) {
          window.top._chromeCurrentWindow.document.querySelector(selector).value = text
        }, selector, text)
      }
      await this.blurSelector(selector)
    })
  }

  insert (selector, string) {
    return this.pipe(async function () {
      if (string == null) {
        string = selector
      } else if (selector != null) {
        await this.waitSelector(selector)
        await this._clickSelector(selector)
      }

      if (string == null) {
        return
      }
      for (let i of string) {
        await this.sendKey(i)
      }
    })
  }

  async _clickSelector (selector) {
    let [ left, top ] = (await this.findPositionInWindow(selector)).split(',').map(i => parseInt(i, 10))
    debug(`left: ${left}, top: ${top}`)
    this._click(this.chrome.client, left, top)
  }

  mousedown (selector) {
    return this.pipe(function () {
      debug('.mousedown() on ' + selector)
      return this.evaluate_now(async function (selector) {
        var element = window.top._chromeCurrentWindow.document.querySelector(selector)
        if (!element) {
          throw new Error('Unable to find element by selector: ' + selector)
        }
        var event = window.top._chromeCurrentWindow.document.createEvent('MouseEvent')
        event.initEvent('mousedown', true, true)
        element.dispatchEvent(event)
      }, selector)
    })
  }

  mouseup (selector) {
    return this.pipe(function () {
      debug('.mouseup() on ' + selector)
      return this.evaluate_now(async function (selector) {
        var element = window.top._chromeCurrentWindow.document.querySelector(selector)
        if (!element) {
          throw new Error('Unable to find element by selector: ' + selector)
        }
        var event = window.top._chromeCurrentWindow.document.createEvent('MouseEvent')
        event.initEvent('mouseup', true, true)
        element.dispatchEvent(event)
      }, selector)
    })
  }

  mouseover (selector) {
    return this.pipe(function () {
      debug('.mouseover() on ' + selector)
      return this.evaluate_now(async function (selector) {
        var element = window.top._chromeCurrentWindow.document.querySelector(selector)
        if (!element) {
          throw new Error('Unable to find element by selector: ' + selector)
        }
        var event = window.top._chromeCurrentWindow.document.createEvent('MouseEvent')
        event.initMouseEvent('mouseover', true, true)
        element.dispatchEvent(event)
      }, selector)
    })
  }

  check (selector) {
    return this.pipe(function () {
      debug('.check() ' + selector)
      return this.evaluate_now(async function (selector) {
        var element = window.top._chromeCurrentWindow.document.querySelector(selector)
        var event = window.top._chromeCurrentWindow.document.createEvent('HTMLEvents')
        element.checked = true
        event.initEvent('change', true, true)
        element.dispatchEvent(event)
      }, selector)
    })
  }

  uncheck (selector) {
    return this.pipe(function () {
      debug('.uncheck() ' + selector)
      return this.evaluate_now(async function (selector) {
        var element = window.top._chromeCurrentWindow.document.querySelector(selector)
        var event = window.top._chromeCurrentWindow.document.createEvent('HTMLEvents')
        element.checked = null
        event.initEvent('change', true, true)
        element.dispatchEvent(event)
      }, selector)
    })
  }

  select (selector, option) {
    return this.pipe(function () {
      debug('.select() ' + selector)
      return this.evaluate_now(async function (selector, option) {
        var element = window.top._chromeCurrentWindow.document.querySelector(selector)
        var event = window.top._chromeCurrentWindow.document.createEvent('HTMLEvents')
        element.value = option
        event.initEvent('change', true, true)
        element.dispatchEvent(event)
      }, selector, option)
    })
  }

  back () {
    return this.pipe(function () {
      debug('.back()')
      return this.evaluate_now(async function () {
        window.top._chromeCurrentWindow.history.back()
      })
    })
  }

  forward () {
    return this.pipe(function () {
      debug('.forward()')
      return this.evaluate_now(async function () {
        window.top._chromeCurrentWindow.history.forward()
      })
    })
  }

  refresh () {
    return this.pipe(function () {
      debug('.refresh()')
      return this.evaluate_now(async function () {
        window.top._chromeCurrentWindow.location.reload()
      })
    })
  }

  url () {
    return this.pipe(async function () {
      debug('.url()')
      return this.evaluate_now(async function () {
        return window.location.href
      })
    })
  }

  click (selector) {
    return this.pipe(async function () {
      debug('.click() ' + selector)
      await this.waitSelector(selector)
      return this._clickSelector(selector)
    })
  }

  title () {
    return this.pipe(async function () {
      debug('.title()')
      return this.evaluate_now(async function () {
        return window.top._chromeCurrentWindow.document.title
      })
    })
  }

  viewport (width, height, mobile = false) {
    if (!width) {
      throw new Error('viewport can`t be null')
    }
    debug('.viewport()', width, height)
    this.options.windowSize = [ width, height ]
    return this
    // return this.pipe(async function () {
      // debug('.viewport()', width, height)
      // const deviceMetrics = {
      //   width: ~~width,
      //   height: ~~height || ~~width,
      //   deviceScaleFactor: 0,
      //   mobile,
      //   fitWindow: false
      // }

      // await this.chrome.client.Emulation.setDeviceMetricsOverride(deviceMetrics)
      // if (height === undefined) {
      //   const {root: {nodeId: documentNodeId}} = await this.chrome.client.DOM.getDocument()
      //   const {nodeId: bodyNodeId} = await this.chrome.client.DOM.querySelector({
      //     selector: 'body',
      //     nodeId: documentNodeId
      //   })
      //   width = 1800
      //   height = (await this.chrome.client.DOM.getBoxModel({ nodeId: bodyNodeId })).model.height
      // }
      // await this.chrome.client.Emulation.setVisibleSize({ width: ~~width, height: ~~height })
      // await this.chrome.client.Emulation.forceViewport({x: 0, y: 0, scale: 1})
    // })
  }

  _writeFile (data, path, isBase64 = true) {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, isBase64 ? Buffer.from(data, 'base64') : data, (err, ret) => {
        if (err) {
          reject(err)
        } else {
          resolve(ret)
        }
      })
    })
  }

  useragent (userAgent) {
    return this.pipe(async function () {
      debug('.useragent()')
      return this.chrome.client.Network.setUserAgentOverride({ userAgent })
    })
  }

  html (path) {
    return this.pipe(async function () {
      debug('.html()')
      const html = await this.evaluate_now(async function () {
        return new window.XMLSerializer().serializeToString(document.doctype) + '\n' + document.documentElement.outerHTML
      })
      if (path) {
        return this._writeFile(html, path, false)
      } else {
        return html
      }
    })
  }

  pdf (path, options = {}) {
    return this.pipe(async function () {
      debug('.pdf()')
      try {
        /**
         * https://github.com/cyrus-and/chrome-remote-interface/issues/202
         */
        const pdf = await this.chrome.client.Page.printToPDF(Object.assign({
          landscape: true,
          printBackground: false,
          marginTop: 4,
          marginBottom: 1,
          marginLeft: 0,
          marginRight: 0,
          paperWidth: 8.2677165,  // A4 paper size
          paperHeight: 11.6929134  // A4 paper size,
        }, options))
        return this._writeFile(pdf.data, path)
      } catch (e) {
        debug('pdf() only support in headless mode')
      }
    })
  }

  screenshot (path, clip) {
    if (!path) {
      throw new Error(`screenshot path can't be empty`)
    }
    return this.pipe(async function () {
      let ext = extname(path)
      debug('.screenshot()')
      let image = await this.chrome.client.Page.captureScreenshot({
        format: ext === '.jpg' ? 'jpeg' : 'png',
        fromSurface: true,
        clip: clip,
        quality: 100
      })
      return this._writeFile(image.data, path)
    })
  }

  path () {
    return this.pipe(async function () {
      debug('.path()')
      return this.evaluate_now(function () {
        return window.location.pathname
      })
    })
  }

  end () {
    return this.pipe(async function (ret) {
      debug('.end()')
      this.chrome.host.kill()
      return ret
    })
  }

  evaluate (fn, ...args) {
    return this.pipe(async function () {
      return this.evaluate_now(fn, ...args)
    })
  }

  _inject (type, content) {
    if (type === 'css') {
      content = 'document.body.appendChild(document.createElement("style")).innerHTML = `' + content + '`'
    }
    return this.evaluate_now(content)
  }

  inject (type, file) {
    return this.pipe(async function () {
      debug('.inject()-ing a file')
      if (type === 'js' || type === 'css') {
        return this._inject(type, fs.readFileSync(file, { encoding: 'utf-8' }))
      } else {
        debug('unsupported file type in .inject()')
      }
    })
  }

  on (type, fn, { detach = true } = {}) {
    return this.pipe(function () {
      let self = this
      let promise = new Promise((resolve, reject) => {
        let nfn = async function () {
          try {
            let result = (await fn.apply(self, arguments)) || {}
            if (result.canceled === true) {
              self.chrome.client.removeListener(type, nfn)
              resolve(result)
            }
          } catch (e) {
            return reject(e)
          }
        }
        this.chrome.client.on(type, nfn)
      })
      if (!detach) {
        return promise
      }
    })
  }

  off (type, fn) {
    return this.pipe(async function () {
      return this.chrome.client.removeListener(type, fn)
    })
  }

  once (type, fn) {
    return this.pipe(async function () {
      let self = this
      return new Promise((resolve, reject) => {
        this.chrome.client.once(type, async function () {
          try {
            resolve(await fn.apply(self, arguments))
          } catch (e) {
            reject(e)
          }
        })
      })
    })
  }

  setExtraHTTPHeaders (params) {
    return this.pipe(async function () {
      debug('.setExtraHTTPHeaders()')
      return this.chrome.client.Network.setExtraHTTPHeaders(params)
    })
  }

  ignoreSWCache (trueOrFalse = true) {
    return this.pipe(function () {
      debug('.ignoreSWCache()')
      return this.chrome.client.Network.setBypassServiceWorker({
        bypass: trueOrFalse
      })
    })
  }

  authentication (username, password) {
    return this.pipe(async function () {
      debug('.authentication()')
      /**
       * https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-AuthChallengeResponse
       */
      return this.chrome.client.Network.AuthChallengeResponse({
        username,
        password
      })
    })
  }

  then (fn) {
    return new Promise((resolve) => {
      this.pipe(function () {
        resolve(fn.apply(this, arguments))
      })
    })
  }

  halt () {
    return this.pipe(function () {
      this.tasks.splice(0, this.tasks.length)
      return this.chrome.host.kill()
    })
  }

  catch () {
    console.log('Please use try catch to catch error!!!')
  }
}

function $ (opts) {
  if (!(this.constructor instanceof Automator)) {
    return new Automator(opts)
  } else {
    return this
  }
}

$.action = function (name, fn, ...args) {
  if (name in Automator) {
    throw new Error(`${name} has defined`)
  }
  Automator.prototype[name] = function (..._args) {
    return this.pipe(function (...__args) {
      return fn.apply(this, [...args, ..._args, ...__args])
    })
  }
}

module.exports = $
