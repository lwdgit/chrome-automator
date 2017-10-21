const Koa = require('koa')
const screenshot = require('./screenshot')
const app = new Koa()

app.use(async ctx => {
  var url = ctx.query.url
  console.log('goto:', url)
  if (!/^https?:\/\/.+/.test(url)) {
    ctx.body = 'url 不合法'
  } else {
    if (!isNaN(ctx.query.wait)) {
      ctx.query.wait = ~~ctx.query.wait
    }
    let data = await screenshot(url, ctx.query.wait, ~~ctx.query.width)
    if (ctx.query.base64) {
      ctx.body = 'data:image/jpeg;base64,' + data
    } else {
      ctx.body = `<img src="data:image/jpeg;base64,${data}" />`
    }
  }
})

app.listen(8000)
console.log('server start success at 8000')
// process.on('unCaughtException', function (err) {
//  console.log(err)
// })
