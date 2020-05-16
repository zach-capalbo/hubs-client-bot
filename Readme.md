# Hubs Bot library

This is very much work in process, but demonstrates how to make a Mozilla hubs
bot using puppeteer

## Usage

1. Install: `npm i hubs-client-bot`

2. Make a bot!

```javascript
const {HubsBot} = require('hubs-client-bot')

async function runBot() {
  let bot = new HubsBot()
  await bot.enterRoom(URL_TO_YOUR_HUBS_ROOM, {name: "My First Bot"})
  await bot.spawnObject({url: URL_TO_AN_OBJECT})
  await bot.say("Hello World I'm here!")
}

runBot()
```
