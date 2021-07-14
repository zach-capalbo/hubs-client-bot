const puppeteer = require('puppeteer')
const fs = require('fs')

class BrowserLauncher_ {
  constructor() {}

  async browser(options) {
    if (this._browser) return await this._browser

    if (fs.existsSync("/.dockerenv"))
    {
      options.headless = true
      options.args = (options.args || []).concat(['--no-sandbox', '--disable-setuid-sandbox'])
    }
    
    this._browser = puppeteer.launch({ args: ['--no-sandbox'] });
    return await this._browser
  }
}

const BrowserLauncher = new BrowserLauncher_()

module.exports = {BrowserLauncher}
