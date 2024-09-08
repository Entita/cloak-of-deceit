import * as Phaser from 'phaser';
import { Socket } from 'socket.io-client';

export class Room extends Phaser.Scene {
  mapSize = { width: 0, height: 0 };
  playerSize = { width: 585, height: 400, maxWidth: 200, currentWidth: 0 };
  bgSize = { width: 800, height: 600 };
  target: any = new Phaser.Math.Vector2();
  socket: Socket | undefined;
  account: any;
  dbGame: any;
  gameState: any;
  allObjectGroup: any = {}
  directions = ['left', 'front', 'right', 'back']
  room_direction: 'left' | 'front' | 'right' | 'back' = 'front'
  room_changin_direction: boolean = false
  direction_shift: number = 0

  constructor() {
    super('room');
  }

  preload() {
    this.load.setBaseURL('/images');
    this.load.image('room_front', '/room_front.png');
    this.load.image('room_left', '/room_left.png');
    this.load.image('room_right', '/room_right.png');
    this.load.image('room_back', '/room_back.png');
    this.load.image('player', '/silhouette.png');
    this.account = this.registry.getAll().account
    this.socket = this.registry.getAll().socket
    this.dbGame = this.registry.getAll().dbGame
    this.load.on('complete', () => this.handleSocket())
  }

  getScale(objectWidth: number, objectHeight: number) {
    const { width, height } = this.game.canvas;
    const widthRatio = width / objectWidth
    const heightRatio = height / objectHeight
    if (widthRatio < heightRatio) {
      const newWidth = Math.min(objectWidth, width)
      const newHeight = (newWidth / objectWidth) * objectHeight
      return { scaleX: newWidth / objectWidth, scaleY: newHeight / objectHeight }
    } else {
      const newHeight = Math.min(objectHeight, height)
      const newWidth = (newHeight / objectHeight) * objectWidth
      return { scaleX: newWidth / objectWidth, scaleY: newHeight / objectHeight }
    }
  }

  getXFromMap(mapCoords: { x: number; y: number }, direction: 'front' | 'left' | 'right' | 'back') {
    if (direction === 'front') return mapCoords.x + this.mapSize.width / 2
    else if (direction === 'left') return mapCoords.x - this.mapSize.width / 2
    else if (direction === 'right') return mapCoords.x + this.mapSize.width / 2 + this.mapSize.width
    return mapCoords.x + this.mapSize.width / 2 + this.mapSize.width * 2
  }

  createSide(direction: 'front' | 'left' | 'right' | 'back') {
    const { width, height } = this.game.canvas

    const map = this.add.image(width / 2, height / 2, `room_${direction}`)
    const mapScale = this.getScale(map.width, map.height)
    map.setScale(mapScale.scaleX, mapScale.scaleY)
    this.mapSize = { width: map.width * mapScale.scaleX, height: map.height * mapScale.scaleY }

    const mapCoords = this.getCoordsInCanvasFromRoom()
    const mapX = this.getXFromMap(mapCoords, direction)

    const directionIndex = this.directions.indexOf(this.room_direction)
    const directionX = this.mapSize.width * directionIndex - this.mapSize.width

    map.setX(mapX - directionX)
    if (!this.allObjectGroup.map) this.allObjectGroup.map = { [direction]: map }
    else this.allObjectGroup.map[direction] = map
  }

  createMap() {
    this.createSide('left')
    this.createSide('front')
    this.createSide('right')
    this.createSide('back')
  }

  createRoomControls() {
    const { width, height } = this.game.canvas
    const leftArrow = this.add.rectangle(20, height / 2 - 25, 40, 50, 0xff0000)
      .setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, 40, 50),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
    })
    const rightArrow = this.add.rectangle(width - 20, height / 2 - 25, 40, 50, 0xff0000)
    .setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 40, 50),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    })
    this.allObjectGroup.controls = [leftArrow, rightArrow]
    this.input.enableDebug(leftArrow)
    this.input.enableDebug(rightArrow)

    leftArrow.on('pointerdown', () => {
      if (!this.room_changin_direction) this.animationMovingMap('right')
    })
    rightArrow.on('pointerdown', () => {
      if (!this.room_changin_direction) this.animationMovingMap('left')
    })
  }

  create() {
    this.createMap()

    // create boundary within mapsize
    const mapCoords = this.getCoordsInCanvasFromRoom()
    this.physics.world.setBounds(
      mapCoords.x,
      mapCoords.y,
      this.mapSize.width,
      this.mapSize.height,
    )

    // create interactive area
    // const zone = this.add.zone(width / 2, height / 2, 100, 150)

    // this.physics.world.enable(zone, 1)
    // this.allObjectGroup.zone = zone

    // controls
    this.createRoomControls()

    this.scale.on('resize', this.resize, this);
  }

  getDirection(direction: 'left' | 'right') {
    const directions: any = ['left', 'front', 'right', 'back']
    const directionIndex = directions.indexOf(this.room_direction)
    var newDirectionIndex = direction === 'left' ? directionIndex + 1 : directionIndex - 1
    if (newDirectionIndex < 0) newDirectionIndex = directions.length - 1
    if (newDirectionIndex > directions.length - 1) newDirectionIndex = 0
    return directions[newDirectionIndex]
  }

  animationMovingMap(direction: 'left' | 'right') {
    const map = this.allObjectGroup.map
    const maps = [map.front, map.left, map.right, map.back]
    const newDirection = this.getDirection(direction)

    // move map
    if (direction === 'right' && this.directions[0] === this.room_direction) {
      map[newDirection].setX(map[newDirection].x - this.mapSize.width * 4)
      this.directions.unshift(this.directions[this.directions.length - 1])
      this.directions.pop()
      this.direction_shift -= 1
      if (this.direction_shift === -4) this.direction_shift = 0
    } else if (direction === 'left' && this.directions[this.directions.length - 1] === this.room_direction) {
      map[newDirection].setX(map[newDirection].x + this.mapSize.width * 4)
      this.directions.push(this.directions[0])
      this.directions.shift()
      this.direction_shift += 1
      if (this.direction_shift === 4) this.direction_shift = 0
    }

    // move animation
    maps.forEach((map: any) => {
      this.room_changin_direction = true
      const tween = this.tweens.add({
        targets: map,
        x: direction === 'left' ? map.x - this.mapSize.width : map.x + this.mapSize.width,
        ease: 'Power1',
        duration: 1000
      })
      tween.on('complete', () => {
        this.room_changin_direction = false
      })
    })
    this.room_direction = newDirection
  }

  resize(gameSize: any) {
    const { width, height } = gameSize
    const mapCoords = this.getCoordsInCanvasFromRoom()

    // scale map
    const map = this.allObjectGroup.map.front
    const mapScale = this.getScale(map.width, map.height)
    map.setScale(mapScale.scaleX, mapScale.scaleY)
    this.mapSize = { width: map.width * mapScale.scaleX, height: map.height * mapScale.scaleY }
    // move all objects
    const phaserObjects = Object.entries(this.allObjectGroup)
    phaserObjects.forEach((phaserObject: any) => {
      if (phaserObject[0] === 'controls') {
        // move temporary controls of room
        phaserObject[1][0].setX(20)
        phaserObject[1][0].setY(height / 2 - 25)
        phaserObject[1][1].setX(width - 20)
        phaserObject[1][1].setY(height / 2 - 25)
      } else if (phaserObject[0] === 'map') {
        const mapSides = Object.entries(phaserObject[1])

        mapSides.forEach((map: any, index: number) => {
          // find new x according to each room based of the room shuffle
          const mapCoords = this.getCoordsInCanvasFromRoom()
          var directionIndex = this.directions.indexOf(this.room_direction) + this.direction_shift
          var directionX = this.mapSize.width * directionIndex - this.mapSize.width
          if (index >= this.directions.length + this.direction_shift) directionX += this.mapSize.width * 4
          if (index < this.direction_shift && this.direction_shift > 0) directionX -= this.mapSize.width * 4
          const mapX = this.getXFromMap(mapCoords, map[0])
          map[1].setX(mapX - directionX)
          map[1].setY(height / 2)
          map[1].setScale(mapScale.scaleX, mapScale.scaleY)
        })
      } else {
        phaserObject[1].setX(width / 2)
        phaserObject[1].setY(height / 2)
      }
    })
    // move boundary
    this.physics.world.setBounds(
      mapCoords.x,
      mapCoords.y,
      this.mapSize.width,
      this.mapSize.height,
    )
    // move players
    this.playerSize.currentWidth = Math.min(this.playerSize.maxWidth, this.mapSize.height * 0.35)
    this.gameState.players.forEach((player: any, index: number) => {
      const playerPositionAndScaling = this.getPlayerPositionAndScaling(index, this.gameState.players.length)
      player.sprite.setX(playerPositionAndScaling.x)
      player.sprite.setY(playerPositionAndScaling.y)
      player.sprite.setScale(playerPositionAndScaling.scale)
    })
  }

  getCoordsInCanvasFromRoom() {
    const { width, height } = this.game.canvas;
    return {
      x: width / 2 - this.mapSize.width / 2,
      y: height / 2 - this.mapSize.height / 2,
    }
  }

  handleSocket() {
    this.socket?.emit('game_gamestate', this.dbGame.code)
    this.socket?.on('game_gamestate', this.handleGameState.bind(this))
  }

  getPlayerPositionAndScaling(index: number, numberOfPlayers: number) {
    const { height } = this.game.canvas
    const canvasX = this.getCoordsInCanvasFromRoom()
    const spaceBetweenPlayers = this.mapSize.width / numberOfPlayers
    const newPlayerWidth = Math.min(spaceBetweenPlayers, this.playerSize.currentWidth)
    const playerScale = newPlayerWidth / this.playerSize.width
    const playerX = canvasX.x + newPlayerWidth / 2 + spaceBetweenPlayers * index + (spaceBetweenPlayers / 2 - newPlayerWidth / 2)
    const playerY = height / 2 + this.mapSize.height / 2 - (this.playerSize.height * playerScale) / 2

    return {
      x: playerX,
      y: playerY,
      scale: playerScale,
    }
  }

  handleGameState(newGameState: any) {
    // update game state with current data
    if (!this.gameState) {
      this.playerSize.currentWidth = Math.min(this.playerSize.maxWidth, this.mapSize.height * 0.35)
      newGameState.players.forEach((player: any, index: number) => {
        const playerPositionAndScaling = this.getPlayerPositionAndScaling(index, newGameState.players.length)
        player.sprite = this.physics.add.image(playerPositionAndScaling.x, playerPositionAndScaling.y, 'player')
        player.sprite.setScale(playerPositionAndScaling.scale)
      })
      this.gameState = newGameState
    }
    this.gameState = newGameState
  }

  update() {

  }
}
