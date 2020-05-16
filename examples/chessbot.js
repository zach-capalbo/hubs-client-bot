const {HubsBot} = require('../index.js')

class ChessBot extends HubsBot {
  constructor({...args} = {}) {
    super({name: "Chess Bot", ...args})
  }
  async dropPawn(position) {
    this.pieces = this.pieces || []
    this.pieces.push(this.spawnObject({
      url: "https://uploads-prod.reticulum.io/files/f1d4edc9-2215-436c-9c27-5441f4463062.glb",
      position,
      dynamic: true,
      gravity: { x: 0, y: -9.8, z: 0 },
      autoDropTimeout: 1000
    }))
  }
  async populateBoard() {
    console.log("Populating board")
    for (let i = 0; i < 8; ++i)
    {
      await this.dropPawn(`${3.5 - i} 1 2`)
      await this.page.waitFor(100)
    }
  }

  async runBot(room) {
    await this.catchAndScreenShot(async () => {
      await this.enterRoom(room)
      await this.populateBoard()
    })
  }
}

new ChessBot({headless: false}).runBot("https://hubs.mozilla.com/NA4yYAL/artistic-snow-spot")
