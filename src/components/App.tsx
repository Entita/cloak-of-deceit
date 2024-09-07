"use client"
import React from 'react'
import Game from './Game';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { getAccountFromLocal } from '@/utils/account'
import Menu from './Menu';
import axios from 'axios';

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ?? ''

export default function App() {
  const { data: session, status } = useSession()
  const [game, setGame] = React.useState(null)
  const [socket, setSocket] = React.useState<Socket | null>(null)
  const [account, setAccount] = React.useState<any>(null)

  const getGame = () => {
    axios.get(`/api/game?accountId=${account._id}&socketId=${socket?.id}`)
      .then(({ data }) => {
        if (data.success) {
          socket?.emit('game_update', data.game.code)
          setGame(data.game)
        }
      })
  }

  React.useEffect(() => {
    const getLocalAccount = async() => {
      const localAccount = await getAccountFromLocal()
      if (localAccount) setAccount(localAccount)
    }

    getLocalAccount()
    const newSocket = io(socketUrl, { transports: ["websocket"] })
    setSocket(newSocket)

    return () => { newSocket.disconnect() }
  }, [])

  React.useEffect(() => {
    if (session) setAccount(session)
  }, [session])

  React.useEffect(() => {
    if (account?._id) getGame()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?._id])

  if (socket === null || status === 'loading') return <></>

  return (
    <>
      {game === null ? <Menu account={account} socket={socket} setGame={setGame} setAccount={setAccount} />
                     : <Game account={account} socket={socket} game={game} />}
    </>
  )
}
