const chrome = require('..')

try {
  chrome()
    .goto('https://cn.bing.com/').viewport(1440).scrollTo(1, 1).screenshot().end().then((data) => {
      console.log('base64 Data length:', data.length)
    })
} catch (e) {
  console.log(e)
  chrome().end()
}
