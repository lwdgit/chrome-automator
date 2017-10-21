const chrome = require('chrome-automator')
chrome.action('image', async function () {
  const { DOM, Page, Emulation } = this.chrome.client
  const viewportWidth = 1440
  const {root: {nodeId: documentNodeId}} = await DOM.getDocument();
  const {nodeId: bodyNodeId} = await DOM.querySelector({
    selector: 'body',
    nodeId: documentNodeId
  });
  const {model} = await DOM.getBoxModel({nodeId: bodyNodeId});
  const viewportHeight = model.height;
  await Emulation.setVisibleSize({width: viewportWidth, height: viewportHeight});
  const screenshot = await Page.captureScreenshot({
    format: 'jpeg',
    fromSurface: true,
    quality: 100,
    clip: {
        x: 0,
        y: 0,
        scale: 1,
      width: viewportWidth,
      height: viewportHeight
    }
  });
  console.log('get data')
  return screenshot.data
})

module.exports = function (url, wait) {
    try {
        return chrome()
        .goto(url).wait(wait || 1).image().end()
    } catch (e) {
        console.log(e)
        return chrome().end()
    }
}
