# Hubs Bot library

[Documentation](https://zach-geek.gitlab.io/hubs-client-bot/)

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

## In-Browser bots

Using `HubsBot.asBrowserBot`, you can convert a bot into a script which can be
run using the developer console or inserted into hubs-cloud .js files. For
instance, converting the example bot above like this:

```javascript
const {HubsBot} = require('hubs-client-bot')

let botScript = new HubsBot().asBrowserBot(bot => {
  await bot.enterRoom(URL_TO_YOUR_HUBS_ROOM, {name: "My First Bot"})
  await bot.spawnObject({url: URL_TO_AN_OBJECT})
  await bot.say("Hello World I'm here!")
}).toString()

console.log(botScript)
```

will print out (script truncated):

```javascript
class InBrowserBot {
  ...
  [DEFINITION TRUNCATED FOR README]
  ...
}
var HubsBot = InBrowserBot;
var _fn = async bot => {
  await bot.enterRoom(URL_TO_YOUR_HUBS_ROOM, {name: "My First Bot"})
  await bot.spawnObject({url: URL_TO_AN_OBJECT})
  await bot.say("Hello World I'm here!")
};
window.bot = new HubsBot(); _fn(window.bot);
```

which could then be copied and pasted into the developer console.
