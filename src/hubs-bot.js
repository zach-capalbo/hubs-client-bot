const {URL} = require('url')
const {BrowserLauncher} = require('./browser-launcher.js')

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
        gravity = { x: 0, y: -9.8, z: 0 },
        autoDropTimeout,
      } = opts
      let el = document.createElement("a-entity")

      let loaded = new Promise((r, e) => { el.addEventListener('loaded', r, {once: true})})

      el.setAttribute('scale', scale)
      el.setAttribute('position', position)
      el.setAttribute('media-loader', {src: url, resolve: true, fitToBox: false})
      el.setAttribute('networked', {template: '#interactable-media'})
      document.querySelector('a-scene').append(el)

      await loaded
      let netEl = await NAF.utils.getNetworkedEntity(el)

      if (dynamic)
      {
        await new Promise((r,e) => window.setTimeout(r, 200))
        async function drop() {
          console.log("Dropping!")

          if (!NAF.utils.isMine(netEl)) await NAF.utils.takeOwnership(netEl)

          netEl.setAttribute('floaty-object', {
            autoLockOnLoad: false,
            gravitySpeedLimit: 0,
            modifyGravityOnRelease: false
          })

          const DEFAULT_INTERACTABLE = 1 | 2 | 4 | 8
          netEl.setAttribute("body-helper", {
            type: 'dynamic',
            gravity: gravity,
            angularDamping: 0.01,
            linearDamping: 0.01,
            linearSleepingThreshold: 1.6,
            angularSleepingThreshold: 2.5,
            collisionFilterMask: DEFAULT_INTERACTABLE
          });

          const physicsSystem = document.querySelector('a-scene').systems["hubs-systems"].physicsSystem;
          if (netEl.components["body-helper"].uuid) {
            physicsSystem.activateBody(netEl.components["body-helper"].uuid);
          }
        }

        await drop()

        if (autoDropTimeout)
        {
          let dropTimer
          let lastPosition = new THREE.Vector3()
          lastPosition.copy(el.object3D.position)

          window.setInterval(async () => {
            let netEl = await NAF.utils.getNetworkedEntity(el)
            if (NAF.utils.isMine(netEl)) return

            if (lastPosition.distanceTo(el.object3D.position) > 0.01)
            {
              console.log("Moved Resetting")
              if (typeof dropTimer !== 'undefined') {
                window.clearTimeout(dropTimer)
                dropTimer = undefined
              }
            }
            else if (typeof dropTimer === 'undefined')
            {
              dropTimer = window.setTimeout(drop, autoDropTimeout)
            }

            lastPosition.copy(el.object3D.position)
          }, 100)
        }

      }

      return netEl.id
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

  async setName(name) {
    await this.page.evaluate((name) => {
      window.APP.store.update({
        activity: {
          hasChangedName: true,
          hasAcceptedProfile: true
        },
        profile: {
          // Prepend (bot) to the name so other users know it's a bot
          displayName: "bot - " + name
      }})
    }, name)
  }

  async say(message) {
    await this.page.evaluate((message) => {
      window.APP.hubChannel.sendMessage(message)
    }, message)
  }
}

module.exports = {HubsBot}
