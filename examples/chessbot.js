// Sets up a chess board for a room with this scene: https://hubs.mozilla.com/scenes/qEa4XwA

const {HubsBot} = require('../index.js')

class ChessBot extends HubsBot {
  static PIECE_MODELS = {
    black: {
      pawn: "https://uploads-prod.reticulum.io/files/f1d4edc9-2215-436c-9c27-5441f4463062.glb",
      rook: "https://uploads-prod.reticulum.io/files/7cc722a5-aa8a-4f5b-be24-0401cefde6b0.glb",
      knight: "https://uploads-prod.reticulum.io/files/9b2c9b0c-e4a3-46dd-a7ba-c4edfc6de734.glb",
      bishop: "https://uploads-prod.reticulum.io/files/e041d895-6a01-4034-a70e-542d71704cc6.glb",
      queen: "https://uploads-prod.reticulum.io/files/87cdd853-943c-43aa-afdd-5c2255aa18ec.glb",
      king: "https://uploads-prod.reticulum.io/files/8bbd0933-970b-45fe-9d2b-31ecfe51de6f.glb"
    },
    white: {
      pawn: "https://uploads-prod.reticulum.io/files/537e3fb5-3692-4b39-8d5d-28f59d1450d2.glb",
      rook: "https://uploads-prod.reticulum.io/files/590d79bd-3631-485c-9587-e1d5264abbc9.glb",
      knight: "https://uploads-prod.reticulum.io/files/67b9b82a-2e86-4fe0-9935-b3883f9731ee.glb",
      bishop: "https://uploads-prod.reticulum.io/files/9d7436ba-3214-4ca8-b24c-f23c4574e3ef.glb",
      queen: "https://uploads-prod.reticulum.io/files/99764c83-5bae-4317-98a7-3fac40e0ae82.glb",
      king: "https://uploads-prod.reticulum.io/files/f0dc3e18-8557-43ad-af35-bfe880352592.glb",
    }
  }

  constructor({...args} = {}) {
    super({name: "Chess Bot", ...args})
  }
  async dropPiece(color, piece, position) {
    this.pieces = this.pieces || []
    this.pieces.push(await this.spawnObject({
      url: ChessBot.PIECE_MODELS[color][piece],
      position,
      dynamic: true,
      gravity: { x: 0, y: -9.8, z: 0 },
      autoDropTimeout: 1000
    }))
  }
  async populateBoard() {
    console.log("Populating board")

    await this.dropPiece("black", "rook", `3.5 1 3`)
    await this.dropPiece("black", "rook", `${3.5 - 7} 1 3`)

    await this.dropPiece("white", "rook", `3.5 1 -4`)
    await this.dropPiece("white", "rook", `${3.5 - 7} 1 -4`)

    await this.dropPiece("black", "knight", `2.5 1 3`)
    await this.dropPiece("black", "knight", `${2.5 - 5} 1 3`)

    await this.dropPiece("white", "knight", `2.5 1 -4`)
    await this.dropPiece("white", "knight", `${2.5 - 5} 1 -4`)

    await this.dropPiece("black", "bishop", `1.5 1 3`)
    await this.dropPiece("black", "bishop", `${1.5 - 3} 1 3`)

    await this.dropPiece("white", "bishop", `1.5 1 -4`)
    await this.dropPiece("white", "bishop", `${1.5 - 3} 1 -4`)

    await this.dropPiece("white", "queen", `0.5 1 -4`)
    await this.dropPiece("black", "queen", `0.5 1 3`)

    await this.dropPiece("white", "king", `-0.5 1 -4`)
    await this.dropPiece("black", "king", `-0.5 1 3`)

    for (let i = 0; i < 8; ++i)
    {
      await this.dropPiece("black", "pawn", `${3.5 - i} 1 2`)
    }

    for (let i = 0; i < 8; ++i)
    {
      await this.dropPiece("white", "pawn", `${3.5 - i} 1 -3`)
    }
  }

  async runBot(room) {
    await this.enterRoom(room)
    await this.evaluate(() => {
      document.querySelector('*[networked-counter]').setAttribute('networked-counter', {max: 100})
    })
    await this.populateBoard()
    await this.goTo({x: -5.0, y: 0, z: -1})
    await this.say("Let the games begin!")
  }
}

let roomUrl = process.argv[2]

if (!roomUrl)
{
  console.error(`
Usage: node examples/chessbot.js ROOM_URL [--print]

ROOM_URL should be a Mozilla Hubs room that you created setup with this scene:

  https://hubs.mozilla.com/scenes/qEa4XwA

  --print      Will print code to run the bot to stdout so that it can be copied
               and pasted into the developer console, or placed into a hubs-
               cloud .js file.
`)
  process.exit(-1)
}

if (process.argv[3] === '--print')
{
  console.log(
    new ChessBot().asBrowserBot(bot => bot.runBot()).toString()
  )
  process.exit(0)
}
else
{
  new ChessBot({headless: true}).exec(bot => bot.runBot(roomUrl))
}
