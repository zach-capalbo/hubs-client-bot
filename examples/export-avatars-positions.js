
//Created by Teodoro Dannemann --->  https://github.com/teo523    
//Credits to Zach Capalbo ---> https://github.com/zach-capalbo/hubs-client-bot

//This example uses hubs-bot for extracting (x,y,z) positions of every avatar connected to the room.
//You can combine this with sockets.io to stream data to clients (see the following link 
// where I used (x,y) position to create a live map of the room) 
// ----> https://github.com/teo523/hubs-client-bot/tree/metapoiesis

const {HubsBot} = require('../index.js')
const fs = require('fs')


class ExportAvatarPositionBot extends HubsBot {
  constructor({onlyPinned} = {}) {
    super({
      headless: true,
      autoLog: false,
    })
    this.onlyPinned = onlyPinned
  }
  
  //First wait to access the room
  async accessRoom(room) {
    await this.enterRoom(room)
 
    // Wait for network sync. TODO: Add an actual event handler
    await this.page.waitFor(5000);
    

    return this;
  }

  //Get (x,y,z) coordinates of connected avatars
  async exportFromRoom() {
    
    let objects = this.evaluate( async function prueba(onlyPinned) {
      var avatarEntity = "";
      var avatarPositions = [];

      //array with each gltf model
      objArray = await Array.from(document.querySelectorAll("[gltf-model-plus]"));    
      

      for (let i = 0; i < objArray.length;i++){
        //only user avatars contain the class=model, so we filter them
        if (objArray[i].classList[0]=="model") {
        
            //As this function returns a promise, we wrap it with await and store the result in a.
            avatarEntity = await NAF.utils.getNetworkedEntity(objArray[i]);
        
      }
        //add position coordinates to array b.
        if (objArray[i].classList[0]=="model")
          avatarPositions.push(avatarEntity.object3D.position);
      }
      

      return JSON.stringify(avatarPositions)
    }, this.onlyPinned)

    
  
    //console.log(objects);
    return objects
  }

//Continuously call exportFromRoom()
async recursiveCall() {
this.exportFromRoom().then((o) => process.stdout.write(o)).then(() => this.page.waitFor(1000)).then(() =>this.recursiveCall());

}

}




function usage() {
  console.error(`
Usage: node examples/export-avatars-positions.js ROOM_URL
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
    // TODO: Add additional arguments in future
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

//Create a Bot, then access room, then continuously call to export 
new ExportAvatarPositionBot(opts).accessRoom(opts.roomUrl).then((bot) => bot.recursiveCall());

//Wait message
setInterval(function(){ process.stdout.write("Wait... "); }, 3000);


