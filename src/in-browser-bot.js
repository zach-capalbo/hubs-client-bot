class InBrowserBot {
  enterRoom(room) {
    console.warn("Cannot enter room different room from InBrowserBot")
  }
  async evaluate(fn, ...args) {
    await fn(...args)
  }
  async setAttribute(attr, val) {
    document.querySelector('#avatar-rig').setAttribute(attr, val)
  }
  async spawnObject(opts = {}) {
    let {
      url,
      scale = '1 1 1',
      position = '0 0 0',
      rotation = '0 0 0',
      dynamic = false,
      gravity = { x: 0, y: -9.8, z: 0 },
      autoDropTimeout,
      fitToBox = false,
      pinned = false,
    } = opts
    let el = document.createElement("a-entity")

    let loaded = new Promise((r, e) => { el.addEventListener('loaded', r, {once: true})})

    el.setAttribute('scale', scale)
    el.setAttribute('position', position)
    el.setAttribute('rotation', rotation)
    el.setAttribute('media-loader', {src: url, resolve: true, fitToBox})
    el.setAttribute('networked', {template: '#interactable-media'})

    document.querySelector('a-scene').append(el)

    await loaded
    let netEl = await NAF.utils.getNetworkedEntity(el)

    if (dynamic)
    {
      await new Promise((r,e) => window.setTimeout(r, 200))
      async function drop() {
        console.log("Dropping!")

        if (!NAF.utils.isMine(netEl)) await NAF.utils.takeOwnership(netEl)

        netEl.setAttribute('floaty-object', {
          autoLockOnLoad: false,
          gravitySpeedLimit: 0,
          modifyGravityOnRelease: false
        })

        const DEFAULT_INTERACTABLE = 1 | 2 | 4 | 8
        netEl.setAttribute("body-helper", {
          type: 'dynamic',
          gravity: gravity,
          angularDamping: 0.01,
          linearDamping: 0.01,
          linearSleepingThreshold: 1.6,
          angularSleepingThreshold: 2.5,
          collisionFilterMask: DEFAULT_INTERACTABLE
        });

        const physicsSystem = document.querySelector('a-scene').systems["hubs-systems"].physicsSystem;
        if (netEl.components["body-helper"].uuid) {
          physicsSystem.activateBody(netEl.components["body-helper"].uuid);
        }
      }

      await drop()

      if (autoDropTimeout)
      {
        let dropTimer
        let lastPosition = new THREE.Vector3()
        lastPosition.copy(el.object3D.position)

        window.setInterval(async () => {
          let netEl = await NAF.utils.getNetworkedEntity(el)
          if (NAF.utils.isMine(netEl)) return

          if (lastPosition.distanceTo(el.object3D.position) > 0.01)
          {
            console.log("Moved Resetting")
            if (typeof dropTimer !== 'undefined') {
              window.clearTimeout(dropTimer)
              dropTimer = undefined
            }
          }
          else if (typeof dropTimer === 'undefined')
          {
            dropTimer = window.setTimeout(drop, autoDropTimeout)
          }

          lastPosition.copy(el.object3D.position)
        }, 100)
      }

    }

    if (pinned) {
      await new Promise((r,e) => window.setTimeout(r, 2000))
      netEl.setAttribute('pinnable', {pinned})
    }

    return netEl.id
  }

  async goTo(positionOrX, optsOrY, z, opts)
  {
    let x,y
    if (typeof z === 'undefined') {
      x = positionOrX.x
      y = positionOrX.y
      z = positionOrX.z
      opts = optsOrY
    } else {
      x = positionOrX
      y = optsOrY
    }

    document.querySelector('#avatar-rig').setAttribute('position', {x,y,z})
  }

  async setName(name) {
    window.APP.store.update({
      activity: {
        hasChangedName: true,
        hasAcceptedProfile: true
      },
      profile: {
        // Prepend (bot) to the name so other users know it's a bot
        displayName: "bot - " + name
    }})
  }

  async say(message) {
    window.APP.hubChannel.sendMessage(message)
  }

  async changeScene(url) {
    this.props.hubChannel.updateScene(url);
  }

  async controlHands() {
    if (this.handsControlled) return
    document.querySelectorAll('.left-controller,.right-controller').forEach(controller => {
      const controlsBlacklist = [
        "tracked-controls",
        "hand-controls2",
        "vive-controls",
        "oculus-touch-controls",
        "windows-motion-controls",
        "daydream-controls",
        "gearvr-controls"
      ];
      controlsBlacklist.forEach(controlsComponent => controller.removeAttribute(controlsComponent));
      controller.removeAttribute('visibility-by-path')
      controller.setAttribute("visible", true);
    })
    this.handsControlled = true
  }

  async setAvatarLocations({leftHand, rightHand, head})
  {
    // await this.controlHands()
    if (leftHand) {
      document.querySelector('.left-controller').setAttribute('position', leftHand.position)
      document.querySelector('.left-controller').setAttribute('rotation', leftHand.rotation)
    }

    if (rightHand) {
      document.querySelector('.right-controller').setAttribute('position', rightHand.position)
      document.querySelector('.right-controller').setAttribute('rotation', rightHand.rotation)
    }

    if (head) {
      document.querySelector('#avatar-pov-node').setAttribute('rotation', head.rotation)
      document.querySelector('#avatar-pov-node').setAttribute('position', head.position)
    }
  }
}

module.exports = {InBrowserBot}
