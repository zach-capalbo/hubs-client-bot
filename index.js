const puppeteer = require('puppeteer')

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

class HubsBot {
  constructor({headless = true} = {}) {
    this.headless = headless
    this.browserLaunched = this.launchBrowser()
  }

  async launchBrowser () {
    this.browser = await puppeteer.launch({headless: this.headless});
    this.page = await this.browser.newPage();

    const context = this.browser.defaultBrowserContext();
    context.overridePermissions("https://hubs.mozilla.com", ['microphone', 'camera'])
    context.overridePermissions("https://hubs.link", ['microphone', 'camera'])
  }

  async enterRoom(roomUrl, opts = {}) {
    await this.browserLaunched

    await this.page.goto(roomUrl, {waitUntil: 'networkidle2'})
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
  }

  async setAttribute(attr, val) {
    await this.page.evaluate((attr, val) => {
      document.querySelector('#avatar-rig').setAttribute(attr, val)
    }, attr, val)
  }

  async spawnObject(opts = {})
  {
    await this.page.evaluate(async (opts) => {
      let {
        url,
        scale = '1 1 1',
        position = '0 0 0',
        dynamic = false,
      } = opts
      const eggURL = "https://uploads-prod.reticulum.io/files/031dca7b-2bcb-45b6-b2df-2371e71aecb1.glb"
      let el = document.createElement("a-entity")

      let loaded = new Promise((r, e) => { el.addEventListener('loaded', r, {once: true})})

      el.setAttribute('scale', scale)
      el.setAttribute('position', position)
      el.setAttribute('media-loader', {src: url, resolve: true, fitToBox: true})
      el.setAttribute('networked', {template: '#interactable-media'})
      document.querySelector('a-scene').append(el)

      await loaded

      if (dynamic)
      {
        const DEFAULT_INTERACTABLE = 1 | 2 | 4 | 8
        el.setAttribute("body-helper", { type: 'dynamic',
          gravity: { x: Math.random() * 6 - 3, y: -9.8, z: Math.random() * 6 - 3 },
          angularDamping: 0.01,
          linearDamping: 0.01,
          linearSleepingThreshold: 1.6,
          angularSleepingThreshold: 2.5,
          collisionFilterMask: DEFAULT_INTERACTABLE
        });
      }
    }, opts)
  }
  async goTo(positionOrX, optsOrY, z, opts) {
    let x,y
    if (typeof z === 'undefined') {
      x = positionOrX.x
      y = positionOrX.y
      z = positionOrX.z
      opts = optsOrY
    } else {
      x = positionOrX
      y = optsOrY
    }

    await this.setAttribute('position', {x, y, z})
  }
}

module.exports = {HubsBot}
