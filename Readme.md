# Hubs Bot library

This is very much work in process, but demonstrates how to make a Mozilla hubs
bot using puppeteer

**WARNING.** This library relies on Hubs-internal APIs and layouts. It is
subject to change or breaking at any time.

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

## Running the examples

The best way to run the examples is to clone this repository or download the zip
file, then use node to run the examples.

```sh
git clone git@github.com:zach-capalbo/hubs-client-bot.git
cd hubs-client-bot
npm install
node examples/eggbot.js ROOM_URL
```

However, puppeteer can be tricky to install, and match with the right node
versions. In this case, docker might be easier to use. Make sure you have docker
installed first, then you can do

```sh
git clone git@github.com:zach-capalbo/hubs-client-bot.git
cd hubs-client-bot
docker run --rm -ti -v /`pwd`:/src buildkite/puppeteer node //src/examples/eggbot.js ROOM_URL
```
