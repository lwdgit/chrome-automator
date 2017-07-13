const Chrome = require('./chrome')
const debug = require('debug')('chrome')
const jsesc = require('jsesc')
const { Flow } = require('myflow')
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))


class Container extends Flow {
  constructor () {
    super()
    Chrome().
    then((chrome) => {
      this.chrome = chrome
      this.run()
    })
  }
  goto (url) {
    return this.pipe(function () {
      return this.chrome.Page.navigate({ url })
    })
  }

  waitfn (fn, ...args) {
    var timeout = 10000
    var self = this
    return new Promise(async function (resolve) {
      const startTime = Date.now()
      while(Date.now() - startTime < timeout) {
        await sleep(500)
        var ret = await self.evaluate_now(fn, ...args)
        if (((ret || {}).result || {}).value !== false) {
          break
        }
      }
      resolve()
    })
  }

  waitSelector (selector) {
    return this.waitfn(function(selector) {
      return !!document.querySelector(selector)
    }, selector)
  }

  wait (arg, timeout = 30000) {
    return this.pipe(function () {
      if (typeof arg === 'number') {
        return sleep(arg)
      } else if (typeof arg === 'string') {
        debug('.wait() for '+arg+' element'+(timeout ? ' or '+timeout+'msec' : ''));
        return this.waitSelector(arg)
      } else if (typeof arg === 'function') {
        debug('.wait() for '+arg+' function '+(timeout ? ' or '+timeout+'msec' : ''));
        return this.waitfn(arg)
      }
    })
  }

  evaluate_now (fn, ...args) {
    // console.log(`Promise.resolve((${fn.toString()})(${args.map((arg) => JSON.stringify(jsesc(arg))).join()}))`)
    
    return this.chrome.Runtime.evaluate({
      expression: `Promise.resolve((${fn.toString()})(${args.map((arg) => JSON.stringify(jsesc(arg))).join()}))`,
      awaitPromise: true
    })
  }

  visible (selector) {
    return this.pipe(function (selector) {
      debug('.visible() for ' + selector);
      this.evaluate_now(async function(selector) {
        var elem = document.querySelector(selector);
        if (elem) return (elem.offsetWidth > 0 && elem.offsetHeight > 0);
        else return false;
      }, selector);
    })
  }

  exists (selector) {
    return this.pipe(function (selector) {
      debug('.exists() for ' + selector);
      return this.evaluate_now(function(selector) {
        return (document.querySelector(selector) !== null);
      }, selector);
    })
  }

  focusSelector (selector) {
    return this.evaluate_now(function(selector) {
      document.querySelector(selector).focus();
    }, selector);
  }

  blurSelector (selector) {
    return this.evaluate_now(function(selector) {
      //it is possible the element has been removed from the DOM
      //between the action and the call to blur the element
      var element = document.querySelector(selector);
      if(element) {
        element.blur()
      }
    }, selector);
  }

  async findPositionInWindow (obj) {
    return (await this.evaluate_now(function (obj, sleep) {
      if (typeof obj === 'string') {
        var expression = obj
        obj = document.querySelector(expression)
        if (!obj) {
          throw new Error('cannot find an object using expression ' + expression)
        }
      }
      obj.scrollIntoViewIfNeeded()
      var rect = obj.getBoundingClientRect()
      return [ rect.x + 1, rect.y + 1 ].join()
    }, obj)).result.value || '-1,-1'
  }

  _touch (client, x, y) {
    const options = {
      touchPoints: [{
        x: x, 
        y: y, 
        state:'touchPressed'
      }]
    }

    options.type = 'touchStart';
    client.Input.dispatchTouchEvent(options);

    options.touchPoints[0].state = 'touchReleased';
    options.type = 'touchEnd';
    client.Input.dispatchTouchEvent(options);
  }

  _click (client, x, y) {
    const options = {
        x: x,
        y: y,
        button: 'left',
        clickCount: 1
    };

    options.type = 'mousePressed';
    client.Input.dispatchMouseEvent(options);

    options.type = 'mouseReleased';
    client.Input.dispatchMouseEvent(options);
  }

  async sendKey(char) {
    await this.chrome.Input.dispatchKeyEvent({
      "modifiers": 0,
      "nativeVirtualKeyCode": 55,
      "text": "",
      "type": "rawKeyDown",
      "unmodifiedText": "",
      "windowsVirtualKeyCode": 55
    })
    await this.chrome.Input.dispatchKeyEvent({
      "modifiers": 0,
      "nativeVirtualKeyCode": 0,
      "text": char,
      "type": "char",
      "unmodifiedText": char,
      "isKeypad": true,
      "windowsVirtualKeyCode": 0
    })
    await this.chrome.Input.dispatchKeyEvent({
      "modifiers": 0,
      "nativeVirtualKeyCode": 55,
      "text": "",
      "type": "keyUp",
      "unmodifiedText": "",
      "windowsVirtualKeyCode": 55
    })
  }

  type (selector, text) {
    return this.pipe(async function() {
      debug('.type() %s into %s', text, selector);
      await this.waitSelector(selector)
      await this.clickSelector(selector)
      if ((text || '') == '') {
        await this.evaluate_now(async function(selector) {
          document.querySelector(selector).value = '';
        }, selector);
      } else {
        await this.evaluate_now(async function(selector, text) {
          document.querySelector(selector).value = text;
        }, selector, text);
      }
      await this.blurSelector(selector)
    })
  }

  insert (selector, string) {
    return this.pipe(async function() {
      if (string == null) {
        string = selector
      } else if (typeof selector != null) {
        await this.waitSelector(selector)
        await this.clickSelector(selector)
      }
      
      if (string == null) {
        return
      }
      for (let i of string) {
        await this.sendKey(i)
      }
    })
  }

  async clickSelector (selector) {
    let [ left, top ] = (await this.findPositionInWindow(selector)).split(',').map(i => parseInt(i, 10))
    debug(`left: ${left}, top: ${top}`)
    this._click(this.chrome, left, top)
  }

  mousedown (selector) {
    return this.pipe(function() {
      debug('.mousedown() on ' + selector);
      return this.evaluate_now(async function (selector) {
        var element = document.querySelector(selector);
        if (!element) {
          throw new Error('Unable to find element by selector: ' + selector);
        }
        var event = document.createEvent('MouseEvent');
        event.initEvent('mousedown', true, true);
        element.dispatchEvent(event);
      }, selector);
    })
  }

  mouseup (selector) {
    return this.pipe(function() {
      debug('.mouseup() on ' + selector);
      return this.evaluate_now(async function (selector) {
        var element = document.querySelector(selector);
        if (!element) {
          throw new Error('Unable to find element by selector: ' + selector);
        }
        var event = document.createEvent('MouseEvent');
        event.initEvent('mouseup', true, true);
        element.dispatchEvent(event);
      }, selector);
    })
  }

  mouseover (selector) {
    return this.pipe(function() {
      debug('.mouseover() on ' + selector);
      return this.evaluate_now(async function (selector) {
        var element = document.querySelector(selector);
        if (!element) {
          throw new Error('Unable to find element by selector: ' + selector);
        }
        var event = document.createEvent('MouseEvent');
        event.initMouseEvent('mouseover', true, true);
        element.dispatchEvent(event);
      }, selector);
    })
  }

  check (selector) {
    return this.pipe(function () {
      debug('.check() ' + selector);
      return this.evaluate_now(async function(selector) {
        var element = document.querySelector(selector);
        var event = document.createEvent('HTMLEvents');
        element.checked = true;
        event.initEvent('change', true, true);
        element.dispatchEvent(event);
      }, selector);
    })
  }

  uncheck (selector){
    return this.pipe(function() {
      debug('.uncheck() ' + selector);
      return this.evaluate_now(async function(selector) {
        var element = document.querySelector(selector);
        var event = document.createEvent('HTMLEvents');
        element.checked = null;
        event.initEvent('change', true, true);
        element.dispatchEvent(event);
      }, selector);
    })
  }

  select (selector, option) {
    return this.pipe(function() {
      return debug('.select() ' + selector);
      this.evaluate_now(async function(selector, option) {
        var element = document.querySelector(selector);
        var event = document.createEvent('HTMLEvents');
        element.value = option;
        event.initEvent('change', true, true);
        element.dispatchEvent(event);
      }, selector, option);
    })
  }

  back () {
    return this.pipe(function() {
      debug('.back()');
      return this.evaluate_now(async function() {
        window.history.back()
      })
    })
  }

  forward () {
    return this.pipe(function() {
      debug('.forward()')
      return this.evaluate_now(async function() {
        window.history.forward()
      })
    })
  }

  refresh () {
    return this.pipe(function () {
      debug('.refresh()')
      return this.evaluate_now(async function() {
        window.location.reload()
      })
    })
  }

  type (selector, text) {
    return this.pipe(async function() {
      debug('.type() %s into %s', text, selector);
      await this.waitSelector(selector)
      await this.focusSelector(selector)
      if ((text || '') == '') {
        await this.evaluate_now(async function(selector) {
          document.querySelector(selector).value = '';
        }, selector);
      } else {
        await this.evaluate_now(async function(selector, text) {
          document.querySelector(selector).value = text;
        }, selector, text);
      }
      await this.blurSelector(selector)
    })
  }

  url () {
    return this.pipe(async function() {
      return (await this.evaluate_now(async function() {
        return location.href
      })).result.value
    })
  }

  title () {
    return this.pipe(async function() {
      return (await this.evaluate_now(async function() {
        return document.title
      })).result.value
    })
  }

  end () {
    return this.pipe(async function() {
      this.chrome.close()
    })
  }
  
  evaluate (fn, ...args) {
    return this.pipe(async function () {
      return (await this.evaluate_now(fn, ...args)).result.value
    })
  }

  then(fn) {
    return this.pipe(fn)
  }

  click (selector) {
    return this.pipe(async function () {
      await this.waitSelector(selector)
      return this.clickSelector(selector)
    })
  }
}

module.exports = Container