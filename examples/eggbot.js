const {HubsBot} = require('../index.js')

async function run() {
  eggBot = new HubsBot()
  await eggBot.enterRoom("https://hub.link/cmPv8xv", {name: "Egg Bot"})
  setInterval(() => {
    eggBot.say("Here's an egg for you!")
    eggBot.spawnObject({
      url: "https://uploads-prod.reticulum.io/files/031dca7b-2bcb-45b6-b2df-2371e71aecb1.glb",
      dynamic: true,
      position: `${Math.random() * 3 - 1.5} ${Math.random() * 2 + 1} ${Math.random() * 4 - 2}`
    })
  }, 5000)
}

run()
