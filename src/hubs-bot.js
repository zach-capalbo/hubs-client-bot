const {URL} = require('url')
const {EventEmitter} = require('events')
const {BrowserLauncher} = require('./browser-launcher.js')
const {InBrowserBot} = require('./in-browser-bot.js')
const {InBrowserBotBuilder} = require('./in-browser-bot-builder.js')

class PageUtils {
  constructor({page, autoLog = true}) {
    this.page = page
    this.autoLog = autoLog
  }
  async clickSelectorClassRegex(selector, classRegex, attempts) {
    if (this.autoLog) console.log(`Clicking for a ${selector} matching ${classRegex}`)
    if (!attempts) attempts = 1;

    while (attempts > 0)
    {
      try {
        await this.page.evaluate((selector, classRegex) => {
          classRegex = new RegExp(classRegex)
          let buttons = Array.from(document.querySelectorAll(selector))
          let enterButton = buttons.find(button => Array.from(button.classList).some(c => classRegex.test(c)))
          enterButton.click()
        }, selector, classRegex.toString().slice(1,-1))
      } catch (e) {
        if (--attempts === 0) {
          throw e;
        }
        await this.page.waitFor(200)
      }
    }
  }

  async clickSelectorTextRegex(selector, textRegex) {
    if (this.autoLog) console.log(`Clicking for a ${selector} matching ${textRegex}`)

    await this.page.evaluate((selector, textRegex) => {
      textRegex = new RegExp(textRegex)
      let buttons = Array.from(document.querySelectorAll(selector))
      let enterButton = buttons.find(button => textRegex.test(button.innerText))
      enterButton.click()
    }, selector, textRegex.toString().slice(1,-1))
  }
}

class El {
  constructor(id) {

  }
}

/**
 * Main class for creating a HubsBot. Dynamically adds all methods from
 * InBrowserBot, which can be called directly from a HubsBot instance.
 * @example
   var bot = new HubsBot();
   bot.goTo(0, 1, 0) // goTo is a InBrowserBot method, but can be called directly on the HubsBot
 * @param {Object} opt See below
 * @param {boolean} opt.headless Set this to false to have puppeteer spawn Chromium window.
 * @param {string} opt.name Name for the bot to appear as ({@link setName})
 * @see InBrowserBot
*/
class HubsBot extends EventEmitter {
  constructor({
    headless = true,
    name = "HubsBot",
    autoLog = true} = {}
  ) {
    super()
    this.headless = headless
    this.browserLaunched = this.launchBrowser()
    this.name = name
    this.autoLog = autoLog

    for (let method of Object.getOwnPropertyNames(InBrowserBot.prototype))
    {
      if (method in this) continue

      this[method] = (...args) => this.evaluate(InBrowserBot.prototype[method], ...args)
    }
  }

  /** Runs a function and takes a screenshot if it fails
   * @param {Function} fn Function to execut _in the node context._
  */
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

  /**
   * Runs a funciton in the browser context
   * @param {Function} fn Function to evaluate in the browser context
   * @param args The arguments to be passed to fn. These will be serailized when passed through puppeteer
  */
  async evaluate(fn, ...args) {
    await this.browserLaunched
    return await this.page.evaluate(fn, ...args)
  }

  /**
   * A main-program type wrapper. Runs a function and quits the bot with a
   * screenshot if the function throws an exception
   * @param {Function} fn Function to evaluate in the node context
  */
  exec(fn) {
    this.catchAndScreenShot(() => fn(this)).catch((e) => {
      console.error("Failed to run. Check botError.png if it exists. Error:", e)
      process.exit(-1)
    })
  }

  /** Launches the puppeteer browser instance. It is not necessary to call this
   *  directly in most cases. It will be done automatically when needed.
  */
  async launchBrowser () {
    this.browser = await BrowserLauncher.browser({
      headless: this.headless,
      defaultViewport: this.headless ? undefined : null,
    });
    this.page = await this.browser.newPage();

    if (this.autoLog)
    {
      this.page.on('console', consoleObj => console.log(">> ", consoleObj.text()));
    }

    const context = this.browser.defaultBrowserContext();
    context.overridePermissions("https://hubs.mozilla.com", ['microphone', 'camera'])
    context.overridePermissions("https://hubs.link", ['microphone', 'camera'])
  }

  /** Enters the room specified, enabling the first microphone and speaker found
   * @param {string} roomUrl The url of the room to join
   * @param {Object} opts
   * @param {string} opts.name Name to set as the bot name when joining the room
   * @param {boolean} opts.manual If true, will wait for you to manually enter the room, rather than entering automatically
  */
  async enterRoom(roomUrl, {name, manual = false} = {}) {
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

    if (!manual) {
      parsedUrl.searchParams.set("bot", "true")
    }

    await this.page.goto(parsedUrl.toString(), {waitUntil: 'domcontentloaded'})

    await this.page.waitFor(() => NAF.connection.isConnected())

    if (this.headless && manual) {
      // Disable rendering for headless, otherwise chromium uses a LOT of CPU
      await this.page.evaluate(() => { AFRAME.scenes[0].renderer.render = function() {} })
    }


    let pu = new PageUtils(this)

    if (manual)
    {
      await this.page.evaluate(() => APP.scene.addEventListener('entered', () => {window.hasBotEnteredRoom = true; }, {once: true}))
      console.info("\n\nPlease go ahead and enter the room manually now.\n")
      await this.page.waitFor(() => window.hasBotEnteredRoom)
      console.log("***Room has been entered manually****")
    }

    this.setName(name)
  }

  onMessage(callback) {
    window.APP.hubChannel.channel.on('message', callback)
  }

  /**
   * Creates an {@link InBrowserBotBuilder} to allow building a bot for use in the
   * developer console.
   * @return {InBrowserBotBuilder} An InBrowserBotBuilder which can be used to
   * create client-side code to execute `fn`. This code can then be copied and
   * pasted into the developer console
   * @param {Function} fn The function to execute in the browser context. The
            `this` passed to fn will be an InBrowserBot version of this bot. If
            this bot is a subclass of HubsBot, the subclassed definitions will
            be injected into the built [InBrowserBot](#inbrowserbot) code.
   * @param args Arguments to be serialized and passed to fn
  */
  asBrowserBot(fn, ...args) {
    return new InBrowserBotBuilder(this, fn, ...args)
  }

  /**
   * Leaves the room and closes the browser instance without exiting node
  */
  quit() {
    this.page.close()
    this.browser.close()
  }
}

module.exports = {HubsBot}
