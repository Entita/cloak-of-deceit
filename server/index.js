const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { dbConnect } = require('./utils/dbMongo');
const { createGameState } = require('./utils/functions');
const { MongoClient } = require('mongodb');
require('dotenv').config()

dbConnect()
const client = new MongoClient(process.env.MONGODB_URL);
client.connect();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());

io.on("connection", async (socket) => {
  const leaveLobby = async (code) => {
    const lobbyCollection = client.db().collection('lobbies')
    const newLobby = await lobbyCollection.findOne({ code })
    socket.to(code).emit('lobby_player_left', newLobby)
    socket.leave(code)
  }

  const lobbyJoin = async(code) => {
    const lobbyCollection = client.db().collection('lobbies')
    const newLobby = await lobbyCollection.findOne({ code })
    socket.to(code).emit('lobby_player_joined', newLobby)
    socket.join(code)
  }

  const lobbyKick = async(code, socketIdOfPlayerToKick) => {
    const lobbyCollection = client.db().collection('lobbies')
    const newLobby = await lobbyCollection.findOne({ code })
    socket.to(code).emit('lobby_player_left', newLobby)
    if (socket.id === socketIdOfPlayerToKick) socket.leave(code)
  }

  const lobbyUpdate = async(code) => {
    const lobbyCollection = client.db().collection('lobbies')
    const newLobby = await lobbyCollection.findOne({ code })
    socket.to(code).emit('lobby_update', newLobby)
    socket.join(code)
  }

  const gameStart = async(code) => {
    const gameCollection = client.db().collection('games')
    const newGame = await gameCollection.findOne({ code })
    const newGameWithMovement = { ...newGame, players: newGame.players.map(player => ({ ...player, x: 0, y: 0 }))}
    await createGameState(newGameWithMovement)
    socket.to(newGame.code).emit('game_start', newGame)
  }

  const gameUpdate = async(code) => {
    const gameCollection = client.db().collection('games')
    const newGame = await gameCollection.findOne({ code })
    socket.join(code)
    socket.to(code).emit('game_update', newGame)
  }

  const getGameState = async(code) => {
    const gameStateCollection = client.db().collection('game-states')
    const gameState = await gameStateCollection.findOne({ code })
    io.to(socket.id).emit('game_gamestate', gameState)
  }

  const gameStateUpdateMovement = async(gameState, code, id, x, y) => {
    const gameStateCollection = client.db().collection('game-states')
    const newGameState = { ...gameState, players: gameState.players.map((player) => player._id === id ? ({ ...player, x, y }) : player) }
    await gameStateCollection.updateOne({ code }, { $set: { players: newGameState.players } })
    io.in(code).emit('game_gamestate_movement', newGameState)
  }

  socket.on('game_movement', ({ gameState, code, id, x, y }) => gameStateUpdateMovement(gameState, code, id, x, y))
  socket.on('game_gamestate', (code) => getGameState(code))
  socket.on('game_start', (code) => gameStart(code))
  socket.on('game_update', (code) => gameUpdate(code))
  socket.on('lobby_kicked', (code, socketIdOfPlayerToKick) => lobbyKick(code, socketIdOfPlayerToKick))
  socket.on('lobby_joined', (code) => lobbyJoin(code))
  socket.on('lobby_update', (code) => lobbyUpdate(code))
  socket.on('lobby_leave', (code) => leaveLobby(code))
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});