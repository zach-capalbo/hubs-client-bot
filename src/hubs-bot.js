const {URL} = require('url')
const {BrowserLauncher} = require('./browser-launcher.js')
const {InBrowserBot} = require('./in-browser-bot.js')
const {InBrowserBotBuilder} = require('./in-browser-bot-builder.js')

class PageUtils {
  constructor(page) {
    this.page = page
  }
  async clickSelectorClassRegex(selector, classRegex) {
    console.log(`Clicking for a ${selector} matching ${classRegex}`)
    await this.page.evaluate((selector, classRegex) => {
      classRegex = new RegExp(classRegex)
      let buttons = Array.from(document.querySelectorAll(selector))
      let enterButton = buttons.find(button => Array.from(button.classList).some(c => classRegex.test(c)))
      enterButton.click()
    }, selector, classRegex.toString().slice(1,-1))
  }
}

class El {
  constructor(id) {

  }
}

class HubsBot {
  constructor({headless = true, name = "HubsBot"} = {}) {
    this.headless = headless
    this.browserLaunched = this.launchBrowser()
    this.name = name

    for (let method of Object.getOwnPropertyNames(InBrowserBot.prototype))
    {
      if (method in this) continue

      this[method] = (...args) => this.evaluate(InBrowserBot.prototype[method], ...args)
    }
  }

  async catchAndScreenShot(fn, path="botError.png") {
    try {
      await fn()
    }
    catch (e) {
      if (this.page)
      {
        console.warn("Caught error. Trying to screenshot")
        this.page.screenshot({path})
      }
      throw e
    }
  }

  async evaluate(...args) {
    await this.browserLaunched
    return await this.page.evaluate(...args)
  }

  exec(fn) {
    this.catchAndScreenShot(() => fn(this)).catch((e) => {
      console.error("Failed to run. Check botError.png if it exists. Error:", e)
      process.exit(-1)
    })
  }

  async launchBrowser () {
    this.browser = await BrowserLauncher.browser({headless: this.headless});
    this.page = await this.browser.newPage();

    this.page.on('console', consoleObj => console.log(">> ", consoleObj.text()));

    const context = this.browser.defaultBrowserContext();
    context.overridePermissions("https://hubs.mozilla.com", ['microphone', 'camera'])
    context.overridePermissions("https://hubs.link", ['microphone', 'camera'])
  }

  async enterRoom(roomUrl, {name} = {}) {
    await this.browserLaunched

    let parsedUrl = new URL(roomUrl)
    const context = this.browser.defaultBrowserContext();
    context.overridePermissions(parsedUrl.origin, ['microphone', 'camera'])

    if (name)
    {
      this.name = name
    }
    else
    {
      name = this.name
    }

    await this.page.goto(roomUrl, {waitUntil: 'domcontentloaded'})
    await this.page.waitFor("button")

    if (this.headless) {
      // Disable rendering for headless, otherwise chromium uses a LOT of CPU
      await this.page.evaluate(() => { AFRAME.scenes[0].renderer.render = function() {} })
    }

    let pu = new PageUtils(this.page)
    await pu.clickSelectorClassRegex("button", /entry__action/)
    await this.page.waitFor("input")
    await pu.clickSelectorClassRegex("input", /profile__form-submit/)
    await this.page.waitFor("button:nth-child(2)")
    await pu.clickSelectorClassRegex("button:nth-child(2)", /entry__entry-button/)

    try
    {
      await this.page.waitFor(2000)
      await pu.clickSelectorClassRegex("button", /mic-grant-panel__next/)
    }
    catch (e)
    {
      // Permission already granted
    }

    await this.page.waitFor(2000)
    await pu.clickSelectorClassRegex("button", /enter/)

    this.setName(name)
  }

  onMessage(callback) {
    window.APP.hubChannel.channel.on('message', callback)
  }

  asBrowserBot(fn) {
    return new InBrowserBotBuilder(this, fn)
  }
}

module.exports = {HubsBot}
