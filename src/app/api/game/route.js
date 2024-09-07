import { NextResponse } from 'next/server'
import Game from '@/models/Game'
import GameState from '../../../../server/models/GameState'
import Lobby from '@/models/Lobby'
import { dbConnect, findMongo, updateMongo } from '@/utils/dbMongo'
import mongoose from 'mongoose'

dbConnect()

const randomNumberBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const hideSecretsFromGame = (game) => {
  return {
    code: game.code,
    winners: game.winners,
    status: game.status,
    player: game.player,
    players: game.players.map((player) => ({
      _id: player._id,
      username: player.username,
    }))
  }
}

const createGame = async (code, socketId, players) => {
  const indexOfSaboteur = randomNumberBetween(0, players.length - 1)
  const gamePlayers = players.map((player, index) => ({ ...player, team: index === indexOfSaboteur ? 'saboteur' : 'escapee' }))
  const playerLeader = gamePlayers.find(player => player.socketId === socketId)
  if (!playerLeader) return null

  const game = await Game({ code, players: gamePlayers }).save()
  return hideSecretsFromGame(game)
}

const removeLobby = async(code) => {
  return await Lobby.deleteOne({ code })
}

const findGameByAccountId = async(accountId, socketId) => {
  const accountMongoId = mongoose.Types.ObjectId.createFromHexString(accountId)
  const game = await findMongo(Game, { 'players._id': accountMongoId, status: 'playing' })
  if (!game) return null

  const gamePlayer = game.players.find(player => player._id === accountId)
  if (socketId && gamePlayer.socketId !== socketId) {
    await updateMongo(Game, { code: game.code, 'players._id': accountMongoId, status: 'playing' }, { $set: { 'players.$.socketId': socketId } })
    return await findMongo(Game, { code: game.code })
  }

  return game
}

export async function GET(req) {
  try {
    const accountId = req.nextUrl.searchParams.get('accountId')
    const socketId = req.nextUrl.searchParams.get('socketId')
    const game = await findGameByAccountId(accountId, socketId)

    return NextResponse.json({ success: game !== null, game })
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { code, socketId, players } = await req.json()
    const game = await createGame(code, socketId, players)
    await removeLobby(code)

    return NextResponse.json({ success: game !== null, game })
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}