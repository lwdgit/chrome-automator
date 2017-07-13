const chrome = require('.')

var c = new chrome()
c.goto('https://m.alibaba.com')
.wait('body')
.click('[clickevent="search"]')
.wait('input[name="SearchText"]')
.click('input[name="SearchText"]')
.type('input[name="SearchText"]', 'syftest')
.insert('input[name="SearchText"]', '\r')
.wait('body')
.click('a[href="https://m.alibaba.com/product/60167549346/syftest-don-t-attachment-english-normal.html"]')
.wait('body')
.click('#btn-contact')
.wait('body')
// .type('#field-content', `
// Hi, 
// I’m interested in your product syftest don't attachment english normal product flower,
// I would like some more details:

// Hello

// I look forward to your reply. 

// Regards
// `)
.insert('#field-content', '\u0009hello world\u000d')
.click('#btn-send')
.wait(function () {
  return !!(document.querySelector('iframe') && document.querySelector('iframe').contentDocument.querySelector('#fm-login-id'))
})
.evaluate(async function () {
})
