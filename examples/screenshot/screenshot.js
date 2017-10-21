const chrome = require('chrome-automator')

module.exports = function (url, wait, width = 1440) {
  try {
    return chrome().goto(url).wait(wait || 1).viewport(width).scrollTo(1, 1).wait(2000).screenshot().end()
  } catch (e) {
    console.log(e)
    return chrome().end()
  }
}
