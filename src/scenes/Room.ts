import * as Phaser from 'phaser';
import { Socket } from 'socket.io-client';

export class Room extends Phaser.Scene {
  mapSize = { width: 400, height: 250 };
  playerSize = { width: 26, height: 32 };
  bgSize = { width: 800, height: 600 };
  target: any = new Phaser.Math.Vector2();
  socket: Socket | undefined;
  account: any;
  dbGame: any;
  gameState: any;
  allObjectGroup: any = {}

  constructor() {
    super('room');
  }

  preload() {
    this.load.setBaseURL('https://labs.phaser.io');
    this.load.image('player', 'assets/sprites/clown.png');
    this.load.image('sky', 'assets/skies/space3.png');
    this.account = this.registry.getAll().account
    this.socket = this.registry.getAll().socket
    this.dbGame = this.registry.getAll().dbGame
    this.handleSocket()
  }

  create() {
    const { width, height } = this.game.canvas;

    // create background
    const bg = this.add.image(width / 2, height / 2, 'sky');
    bg.scaleX = Math.max(width / this.bgSize.width, 1)
    bg.scaleY = Math.max(height / this.bgSize.height, 1)
    this.allObjectGroup.background = bg

    // draw map
    const map = this.add.rectangle(width / 2, height / 2, this.mapSize.width, this.mapSize.height, 0xff0000)
    this.allObjectGroup.map = map

    // create boundary within mapsize
    const mapCoords = this.getCoordsInCanvasFromRoom()
    this.physics.world.setBounds(
      mapCoords.x,
      mapCoords.y,
      this.mapSize.width,
      this.mapSize.height,
    )

    // create interactive area
    const zone = this.add.zone(width / 2, height / 2, 100, 150)

    this.physics.world.enable(zone, 1)
    this.allObjectGroup.zone = zone

    zone.on('enterzone', (collider: any) => console.log('enterzone', collider));
    this.scale.on('resize', this.resize, this);
    this.input.on('pointerdown', this.moveOnClick, this)
  }

  resize(gameSize: any) {
    const { width, height } = gameSize
    const mapCoords = this.getCoordsInCanvasFromRoom()

    // scale background
    const bg = this.allObjectGroup.background
    bg.scaleX = Math.max(width / this.bgSize.width, 1)
    bg.scaleY = Math.max(height / this.bgSize.height, 1)
    // move all objects
    const phaserObjects = Object.entries(this.allObjectGroup)
    phaserObjects.forEach((phaserObject: any) => {
      phaserObject[1].setX(width / 2)
      phaserObject[1].setY(height / 2)
    })
    // move boundary
    this.physics.world.setBounds(
      mapCoords.x,
      mapCoords.y,
      this.mapSize.width,
      this.mapSize.height,
    )
    // move players
    this.gameState.players.forEach((player: any) => {
      const canvasX = mapCoords.x + player.x
      const canvasY = mapCoords.y + player.y
      const minX = mapCoords.x
      const maxX = mapCoords.x + this.mapSize.width
      const minY = mapCoords.y
      const maxY = mapCoords.y + this.mapSize.height
      const isInsideHorizontally = minX < canvasX && canvasX <= maxX
      const isInsideVertically = minY < canvasY && canvasY <= maxY
      if (isInsideHorizontally && isInsideVertically) {
        const newX = canvasX
        const newY = canvasY
        player.sprite.setX(newX)
        player.sprite.setY(newY)
      }
    })
  }

  getCoordsInCanvasFromRoom() {
    const { width, height } = this.game.canvas;
    return {
      x: width / 2 - this.mapSize.width / 2,
      y: height / 2 - this.mapSize.height / 2,
    }
  }

  // getCoordsInRoomFromCanvas(x: number, y: number) {
  //   const mapCoords = this.getCoordsInCanvasFromRoom()

  //   return {
  //     x: mapCoords.x + x,
  //     y: mapCoords.y + y,
  //   }
  // }

  moveOnClick(pointer: any) {
    const mapCoords = this.getCoordsInCanvasFromRoom()
    const minX = mapCoords.x
    const maxX = mapCoords.x + this.mapSize.width
    const minY = mapCoords.y
    const maxY = mapCoords.y + this.mapSize.height
    const isInsideHorizontally = minX < pointer.worldX && pointer.worldX <= maxX
    const isInsideVertically = minY < pointer.worldY && pointer.worldY <= maxY
    if (isInsideHorizontally && isInsideVertically) {
      // if clicked inside a map
      const player = this.gameState.players.find((player: any) => player._id === this.account._id)
      const simpleGameState = JSON.parse(JSON.stringify(this.gameState))
      simpleGameState.players.forEach((player: any) => delete player.sprite)
      // calculate the size of player, so he won't go over bounder
      var newX = pointer.worldX - minX
      var newY = pointer.worldY - minY
      if (newX > this.mapSize.width - this.playerSize.width / 2) newX = this.mapSize.width - this.playerSize.width / 2
      if (newX < this.playerSize.width / 2) newX = this.playerSize.width / 2
      if (newY > this.mapSize.height - this.playerSize.height / 2) newY = this.mapSize.height - this.playerSize.height / 2
      if (newY < this.playerSize.height / 2) newY = this.playerSize.height / 2
      this.socket?.emit('game_movement', {
        gameState: simpleGameState,
        code: this.dbGame?.code,
        id: player._id,
        x: newX,
        y: newY,
      })
    }
  }

  handleSocket() {
    this.socket?.emit('game_gamestate', this.dbGame.code)
    this.socket?.on('game_gamestate', this.handleGameState.bind(this))
    this.socket?.on('game_gamestate_movement', this.handleMovement.bind(this))
  }

  handleMovement(gameState: any) {
    // on any player movement change, this is called and the player that moved is moved
    const mapCoords = this.getCoordsInCanvasFromRoom()

    this.gameState.players.forEach((player: any, index: number) => {
      const newPlayer = gameState.players[index]
      if (player.x === newPlayer.x && player.y === newPlayer.y) return
      const canvasX = mapCoords.x + newPlayer.x
      const canvasY = mapCoords.y + newPlayer.y
      const target = new Phaser.Math.Vector2(canvasX, canvasY)
      player.x = newPlayer.x
      player.y = newPlayer.y
      this.physics.moveToObject(player.sprite, target, 200)
    })
  }

  handleGameState(newGameState: any) {
    // update game state with current data, if init create sprites
    const mapCoords = this.getCoordsInCanvasFromRoom()

    if (!this.gameState) {
      // init players with sprites
      newGameState.players.forEach((player: any) => {
        player.sprite = this.physics.add
          .sprite(mapCoords.x + player.x, mapCoords.y + player.y, 'player')
          .setCollideWorldBounds(true)
        player.sprite.body.debugBodyColor = 0x00ff00;
        this.physics.add.collider(player.sprite, this.allObjectGroup.zone, () => this.allObjectGroup.zone.emit('enterzone', player))
      })
      this.gameState = newGameState
    } else {
      // change state of game state, but keep player sprites
      this.gameState = {
        ...newGameState,
        players: newGameState.players.map((player: any, index: number) => ({
          ...player,
          sprite: this.gameState.players[index].sprite,
        }))
      }
    }
  }

  handleMovementSmoothStop() {
    // if the player is in motion, smoothly stop him if he is close to the target
    if (!this.gameState) return
    const mapCoords = this.getCoordsInCanvasFromRoom()

    this.gameState.players.forEach((player: any) => {
      if (player.sprite.body.speed > 0) {
        const canvasX = mapCoords.x + player.x
        const canvasY = mapCoords.y + player.y
        const target = new Phaser.Math.Vector2(canvasX, canvasY)
        const distance = Phaser.Math.Distance.BetweenPoints(player.sprite.body.center, target);
        // const isPlayerTouching = !player.sprite.body.touching.none
        this.physics.moveToObject(player.sprite, target, 200);
        player.sprite.body.velocity.scale(Phaser.Math.SmoothStep(distance, 0, 20));

        if (distance < 1) {
          player.sprite.body.debugBodyColor = 0x00ff00;
        } else {
          player.sprite.body.debugBodyColor = 0xffff00;
        }
      }
    })
  }

  update() {
    this.handleMovementSmoothStop()
  }
}
