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

  waitelem (selector, timeout = 1000) {
    return this.waitfn(function() {
      return !!document.querySelector(selector)
    }, timeout)
  }

  waitfn (fn, timeout = 0) {
    var self = this
    return new Promise(async function (resolve) {
      const startTime = Date.now()
      while(Date.now() - startTime < timeout) {
        await sleep(500)
        if (await self.evaluate_now(fn)) {
          break
        }
      }
      resolve()
    })
  }

  wait (arg, timeout = 2000) {
    return this.pipe(async function () {
      if (typeof arg === 'number') {
        return sleep(arg)
      } else if (typeof arg === 'string') {
        debug('.wait() for '+arg+' element'+(timeout ? ' or '+timeout+'msec' : ''));
        return this.waitelem(arg, timeout)
      } else if (typeof arg === 'function') {
        debug('.wait() for '+arg+' function '+(timeout ? ' or '+timeout+'msec' : ''));
        return this.waitfn(arg, timeout)
      }
    })
  }

  evaluate_now (fn, ...args) {
    // console.log(`(${fn.toString()})(${args.map((arg) => JSON.stringify(arg)).join()})`)
    return this.chrome.Runtime.evaluate({
      expression: `(${fn.toString()})(${args.map((arg) => JSON.stringify(jsesc(arg))).join()})`,
      awaitPromise: true
    })
  }

  visible (selector) {
    return this.pipe(function (selector) {
      debug('.visible() for ' + selector);
      this.evaluate_now(function(selector) {
        var elem = document.querySelector(selector);
        if (elem) return (elem.offsetWidth > 0 && elem.offsetHeight > 0);
        else return false;
      }, selector);
    })
  }

  exists (selector) {
    return this.pipe(function (selector) {
      debug('.exists() for ' + selector);
      this.evaluate_now(function(selector) {
        return (document.querySelector(selector)!==null);
      }, selector);
    })
  }

  focusSelector (selector) {
    return this.evaluate_now(async function(selector) {
      document.querySelector(selector).focus();
    }, selector);
  }

  blurSelector (selector) {
    return this.evaluate_now(async function(selector) {
      //it is possible the element has been removed from the DOM
      //between the action and the call to blur the element
      var element = document.querySelector(selector);
      if(element) {
        element.blur()
      }
    }, selector);
  }

  clickSelector (selector) {
    return this.evaluate_now(async function (selector) {
      document.activeElement.blur();
      var element = document.querySelector(selector);
      if (!element) {
        throw new Error('Unable to find element by selector: ' + selector);
      }
      var event = document.createEvent('MouseEvent');
      event.initEvent('click', true, true);
      element.dispatchEvent(event);
    }, selector)
  }

 mousedown (selector) {
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
  }

  mouseup (selector) {
    debug('.mouseup() on ' + selector);
    this.evaluate_now(async function (selector) {
      var element = document.querySelector(selector);
      if (!element) {
        throw new Error('Unable to find element by selector: ' + selector);
      }
      var event = document.createEvent('MouseEvent');
      event.initEvent('mouseup', true, true);
      element.dispatchEvent(event);
    }, selector);
  }

  mouseover (selector) {
    debug('.mouseover() on ' + selector);
    this.evaluate_now(function (selector) {
      var element = document.querySelector(selector);
      if (!element) {
        throw new Error('Unable to find element by selector: ' + selector);
      }
      var event = document.createEvent('MouseEvent');
      event.initMouseEvent('mouseover', true, true);
      element.dispatchEvent(event);
    }, selector);
  }

  check (selector) {
    debug('.check() ' + selector);
    this.evaluate_now(function(selector) {
      var element = document.querySelector(selector);
      var event = document.createEvent('HTMLEvents');
      element.checked = true;
      event.initEvent('change', true, true);
      element.dispatchEvent(event);
    }, selector);
  }

  uncheck (selector){
    debug('.uncheck() ' + selector);
    this.evaluate_now(function(selector) {
        var element = document.querySelector(selector);
        var event = document.createEvent('HTMLEvents');
        element.checked = null;
        event.initEvent('change', true, true);
        element.dispatchEvent(event);
      }, selector);
  }

  select (selector, option) {
    debug('.select() ' + selector);
    this.evaluate_now(function(selector, option) {
      var element = document.querySelector(selector);
      var event = document.createEvent('HTMLEvents');
      element.value = option;
      event.initEvent('change', true, true);
      element.dispatchEvent(event);
    }, selector, option);
  }

  back () {
    debug('.back()');
    this.evaluate_now(async function() {
      window.history.back()
    })
  }

  forward () {
    debug('.forward()')
    this.evaluate_now(async function() {
      window.history.forward()
    })
  }


  refresh () {
    debug('.refresh()')
    this.evaluate_now(async function() {
      window.location.reload()
    })
  }

  type (selector, text) {
    return this.pipe(async function() {
      debug('.type() %s into %s', text, selector);
      await this.waitelem(selector)
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
      await this.waitelem(selector)
      return this.clickSelector(selector)
    })
  }
}

module.exports = Container