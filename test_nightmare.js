var Nightmare = require('.')
Nightmare.action('hello', function () {
  console.log('Get url')
  return this.evaluate_now(function () {
    return document.querySelector('#links_wrapper a.result__a').href
  })
})

var nightmare = Nightmare({ show: true })
try {
  nightmare
  .goto('https://duckduckgo.com')
  .type('#search_form_input_homepage', 'github nightmare')
  .click('#search_button_homepage')
  .wait('#zero_click_wrapper .c-info__title a')
  .hello()
  .end()
  .then(function (result) {
    console.log(result)
  })
} catch (e) {
  console.log(e)
}
