#!/usr/bin/env node
const repl = require('repl')
const util = require('util')
const chrome = require('.')
const fs = require('fs')
const path = require('path')

let instance

function toJSON (object) {
  return JSON.stringify(object, null, 2)
}

function display (object) {
  return util.inspect(object, {
    'colors': process.stdout.isTTY,
    'depth': null
  })
}

const chromeStart = function () {
  instance = chrome()
  instance.then(function () {
    for (let func of Object.getOwnPropertyNames(chrome.Automator.prototype)) {
      if (func !== 'constructor' && func.charAt(0) !== '_') {
        cdpRepl.context[func] = function () {
          const i = chrome()
          i[func].apply(i, arguments).pipe((res) => {
            if (res !== undefined) {
              if (typeof res === 'object') {
                res = toJSON(res)
              }
              console.log('\x1b[2K\x1b[G%s', res)
              cdpRepl.displayPrompt(true)
            }
          })
        }
      }
    }
  })
}

const cdpRepl = repl.start({
  prompt: '\x1b[32m.\x1b[0m',
  ignoreUndefined: true,
  writer: display
})

cdpRepl.context.chrome = chromeStart

const homePath = require('os').homedir()
const historyFile = path.join(homePath, '.ca_history')
const historySize = 10000

function loadHistory () {
    // attempt to open the history file
  let fd
  try {
    fd = fs.openSync(historyFile, 'r')
  } catch (err) {
    return // no history file present
  }
    // populate the REPL history
  fs.readFileSync(fd, 'utf8')
        .split('\n')
        .filter(function (entry) {
          return entry.trim()
        })
        .reverse() // to be compatible with repl.history files
        .forEach(function (entry) {
          cdpRepl.history.push(entry)
        })
}

function saveHistory () {
  // only store the last chunk
  const entries = cdpRepl.history.slice(0, historySize).reverse().join('\n')
  fs.writeFileSync(historyFile, entries + '\n')
}

loadHistory()

// disconnect on exit
cdpRepl.on('exit', function () {
  saveHistory()
})
