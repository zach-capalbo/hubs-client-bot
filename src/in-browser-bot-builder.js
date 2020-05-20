const {InBrowserBot} = require('./in-browser-bot.js')

class InBrowserBotBuilder {
  constructor(baseBot, fn) {
    this.actions = []
    this.botProxy = {}

    this.fn = fn
    this.baseBot = baseBot
  }
  toString({
    includeClassDefinition = true,
    closure = true
  } = {})
  {
    let lines = []
    if (includeClassDefinition)
    {
      lines.push(InBrowserBot.toString())
    }

    lines.push (`var HubsBot = InBrowserBot;`)

    let botClassName = this.baseBot.constructor.name

    let botClass = this.baseBot.constructor

    while (botClass.name !== 'InBrowserBot' && botClass.name !== 'HubsBot')
    {
      lines.push(botClass.toString())
      botClass = Object.getPrototypeOf(botClass)
    }

    lines.push(`var _fn = ${this.fn.toString()};`)

    lines.push(`window.bot = new ${botClassName}(); _fn(window.bot);`)

    return lines.join("\n")
  }
}

module.exports = {InBrowserBotBuilder}
