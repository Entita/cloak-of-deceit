import { NextResponse } from 'next/server'
import Lobby from '@/models/Lobby'
import Account from '@/models/Account'
import { dbConnect, findMongo, updateMongo } from '@/utils/dbMongo'
import mongoose from 'mongoose'

dbConnect()

const makeid = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

const createLobby = async (data) => {
  return (await Lobby(data)).save();
}

const findLobby = async(code) => {
  return await findMongo(Lobby, { code })
}

const findLobbyByAccountId = async(accountId, socketId) => {
  const accountMongoId = mongoose.Types.ObjectId.createFromHexString(accountId)
  const lobby = await findMongo(Lobby, { 'players._id': accountMongoId })
  if (!lobby) return null

  const lobbyPlayer = lobby.players.find(player => player._id === accountId)
  if (lobbyPlayer.socketId !== socketId) {
    await updateMongo(Lobby, { code: lobby.code, 'players._id': accountId }, { $set: { 'players.$.socketId': socketId } })
    return await findMongo(Lobby, { code: lobby.code })
  }

  return lobby
}

const joinLobby = async(code, socketId, accountId) => {
  var lobby = await findLobby(code)
  if (lobby === null) return lobby

  const isPlayerAlreadyInLobby = !!lobby.players.find(player => player._id === accountId)
  if (isPlayerAlreadyInLobby) return lobby

  const account = await findAccount(accountId)
  await updateMongo(Lobby, { code }, { $push: { players: { _id: account._id, socketId, username: account.username, leader: lobby.players.length === 0 } } })
  return await findLobby(code)
}

const leaveFromLobby = async(code, accountId, playerToLeaveId) => {
  var lobby = await findLobby(code)
  if (lobby === null) return lobby

  const leader = lobby.players.find(player => player.leader)
  const isLeader = leader._id === accountId
  if (accountId !== playerToLeaveId && !isLeader) return lobby
  await updateMongo(Lobby, { code }, { $pull: { players: { _id: playerToLeaveId } } })

  if (leader._id === playerToLeaveId && lobby.players.length > 1) {
    // Assign new leader
    await updateMongo(Lobby, { code }, { $set: { 'players.0.leader': true } })
  }

  return await findLobby(code)
}

const findAccount = async(id) => {
  return await findMongo(Account, { _id: id })
}

export async function GET(req) {
  try {
    // get lobby from account if any
    const accountId = req.nextUrl.searchParams.get('accountId')
    const socketId = req.nextUrl.searchParams.get('socketId')
    const lobby = await findLobbyByAccountId(accountId, socketId)

    return NextResponse.json({ success: lobby !== null, lobby })
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { code, socketId, accountId } = await req.json()
    if (code) {
      // join lobby
      const lobby = await joinLobby(code.toUpperCase(), socketId, accountId)
      return NextResponse.json({ success: lobby !== null, lobby })
    } else {
      // create lobby
      var lobbyCode = makeid(6)
      var isCodeAlreadyUsed = await findLobby(lobbyCode)
      while (isCodeAlreadyUsed) {
        lobbyCode = makeid(6)
        isCodeAlreadyUsed = await findLobby(lobbyCode)
      }
      const account = await findAccount(accountId)
      const lobby = await createLobby({ code: lobbyCode, players: [{ _id: account._id, socketId, username: account.username, leader: true }] })

      return NextResponse.json({ success: true, lobby })
    }
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const { code, accountId, playerToLeaveId } = await req.json()
    const lobby = await leaveFromLobby(code, accountId, playerToLeaveId)

    return NextResponse.json({ success: lobby !== null, lobby })
  } catch (err) {
    console.log(err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}