const {HubsBot} = require('../index.js')

async function run(roomUrl) {
  eggBot = new HubsBot()
  await eggBot.enterRoom(roomUrl, {name: "Egg Bot"})
  setInterval(() => {
    eggBot.say("Here's an egg for you!")
    eggBot.spawnObject({
      url: "https://uploads-prod.reticulum.io/files/031dca7b-2bcb-45b6-b2df-2371e71aecb1.glb",
      dynamic: true,
      position: `${Math.random() * 3 - 1.5} ${Math.random() * 2 + 1} ${Math.random() * 4 - 2}`
    })
  }, 5000)
}

let roomUrl = process.argv[2]

if (!roomUrl)
{
  console.error(`
Usage: node examples/eggbot.js ROOM_URL [--print]

ROOM_URL should be a Mozilla Hubs room that you created, or where the bot will
be welcome.

  --print      Will print code to run the bot to stdout so that it can be copied
               and pasted into the developer console, or placed into a hubs-
               cloud .js file.
`)
  process.exit(-1)
}

if (process.argv[2] === '--print' || process.argv[3] === '--print')
{
  console.log(new HubsBot().asBrowserBot(run).toString())
  process.exit(0)
}

run(roomUrl).catch((e) => {
  console.error("Failed to run. Check botError.png if it exists. Error:", e)
  process.exit(-1)
})
