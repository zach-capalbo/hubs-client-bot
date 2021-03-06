const {HubsBot} = require('../index.js')
const fs = require('fs')

// Thanks to Fabien Benetou for https://gist.github.com/Utopiah/273ca366149f0a36c75674dd230980ea
class ImportExportBot extends HubsBot {
  constructor({onlyPinned} = {}) {
    super({
      headless: true,
      autoLog: false,
    })
    this.onlyPinned = onlyPinned
  }
  async exportFromRoom(room) {
    await this.enterRoom(room)

    // Wait for network sync. TODO: Add an actual event handler
    await this.page.waitFor(5000)

    let objects = this.evaluate((onlyPinned) => {
      objArray = Array.from(document.querySelectorAll("*[media-loader][networked]")).map(el => {
        return {
          url: el.getAttribute('media-loader').src,
          position: el.getAttribute('position'),
          rotation: el.getAttribute('rotation'),
          scale: el.getAttribute('scale'),
          pinned: el.hasAttribute('pinnable') && el.getAttribute('pinnable').pinned
        }
      })

      if (onlyPinned)
      {
        objArray = objArray.filter(o => o.pinned)
      }

      return JSON.stringify(objArray)
    }, this.onlyPinned)
    return objects
  }

  async importToRoom(room, objects) {
    if (room) await this.enterRoom(room)
    await this.evaluate(() => document.querySelector('*[networked-counter]').setAttribute('networked-counter', {max: 100}))

    for (let obj of objects) {
      obj.fitToBox = true
      this.spawnObject(obj)
    }
  }
}

function usage() {
  console.error(`
Usage: node examples/export-bot.js ROOM_URL [--import [JSON_FILE]]

  --import [JSON_FILE] If specified, imports the objects from the given JSON
                       file, otherwise imports from STDIN
  --print              Used with --import. Prints JavaScript code to STDOUT that
                       can be copied to the developer console in a Hubs Room to
                       import the objects
  --only-pinned         Only export pinned objects

**Note**: Currently, when importing without the --print option, the bot must
          remain running and connected to the room, otherwise the objects
          spawned will disappear.
`)
  process.exit(-1)
}

function parseOpts() {
  let args = process.argv.slice(2)
  let opts = {}
  for (let i = 0; i < args.length; i++)
  {
    let arg = args[i]

    if (!arg.startsWith("--"))
    {
      opts.roomUrl = arg
      continue
    }

    switch (arg) {
    case '--import':
      opts.import = true
      if (!(args[i + 1] || "").startsWith('--'))
      {
        opts.jsonFile = args[++i]
      }
      break;
    case '--print':
      opts.print = true
      break
    case '--only-pinned':
      opts.onlyPinned = true
      break
    default:
      usage()
    }
  }

  if ((!opts.import && !opts.roomUrl)
  || (opts.import && !opts.roomUrl && !opts.print))
  {
    usage()
  }

  return opts
}

let opts = parseOpts()

if (opts.import)
{
  let objs = JSON.parse(fs.readFileSync(opts.jsonFile ? opts.jsonFile : 0))

  if (opts.print)
  {
    process.stdout.write(new ImportExportBot().asBrowserBot((bot, objs) => {
      bot.importToRoom(undefined, objs)
    }, objs).toString())
    process.exit(0)
  }
  else
  {
    new ImportExportBot().importToRoom(opts.roomUrl, objs)
  }
}
else {
  new ImportExportBot(opts).exportFromRoom(opts.roomUrl).then((o) => process.stdout.write(o)).then(() => process.exit(0))
}
