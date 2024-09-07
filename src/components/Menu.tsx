import axios from 'axios';
import React from 'react'
import { Socket } from 'socket.io-client'
import { signOut } from 'next-auth/react'
import { CopyStyled, CreateLobbyButtonStyled, JoinWrapperStyled, KickStyled, LeaderStyled, LobbyCodeStyled, MenuContentStyled, MenuWrapperStyled, PlayersWrapperStyled, PlayerWrapperStyled } from './Menu.style';
import { removeAccountFromLocal } from '@/utils/account'
import Login from './Login';

export default function Menu({ account, socket, setGame, setAccount }: { account: any, socket: Socket; setGame: Function, setAccount: Function }) {
  const [lobby, setLobby] = React.useState<{ code: string; players: { _id: string, socketId: string; username: string, leader: Boolean }[]} | null>(null)
  const currPlayer = React.useMemo(() => lobby ? lobby.players.find(player => player.socketId === socket.id) : null, [lobby, socket])
  const codeRef = React.useRef<HTMLInputElement | null>(null)

  const joinLobby = () => {
    const code = codeRef.current?.value
    if (!code) return
    axios.post('/api', { code, socketId: socket.id, accountId: account._id })
      .then(({ data }) => {
        if (data.success) {
          socket.emit('lobby_joined', data.lobby.code)
          setLobby(data.lobby)
        }
      })
  }

  const createLobby = () => {
    axios.post('/api', { socketId: socket.id, accountId: account._id })
      .then(({ data }) => {
        if (data.success) {
          socket.emit('lobby_joined', data.lobby.code)
          setLobby(data.lobby)
        }
      })
  }

  const leaveLobby = () => {
    axios.put('/api', { code: lobby?.code, accountId: account._id, playerToLeaveId: account._id })
      .then(({ data }) => {
        if (data.success) {
          socket.emit('lobby_leave', data.lobby.code)
          setLobby(null)
        }
      })
  }

  const kickPlayer = (playerToKickId: String) => {
    axios.put('/api', { code: lobby?.code, accountId: account._id, playerToLeaveId: playerToKickId })
      .then(({ data }) => {
        if (data.success) {
          const socketOfPlayerToKick = lobby?.players.find(player => player._id === playerToKickId)?.socketId
          socket.emit('lobby_kicked', data.lobby.code, socketOfPlayerToKick)
          setLobby(data.lobby)
        }
      })
  }

  const startGame = () => {
    axios.post('/api/game', { code: lobby?.code, socketId: socket.id, players: lobby?.players })
      .then(({ data }) => {
        if (data.success) {
          socket.emit('game_start', data.game.code)
          setGame(data.game)
        }
      })
  }

  const getLobby = () => {
    axios.get(`/api?accountId=${account._id}&socketId=${socket.id}`)
      .then(({ data }) => {
        if (data.success) {
          socket.emit('lobby_update', data.lobby.code)
          setLobby(data.lobby)
        }
      })
  }

  const logout = () => {
    removeAccountFromLocal()
    signOut()
  }

  React.useEffect(() => {
    socket.on('lobby_player_joined', lobby => setLobby(lobby))
    socket.on('lobby_player_left', lobby => setLobby(lobby))
    socket.on('lobby_update', lobby => setLobby(lobby))
    socket.on('game_start', game => setGame(game))
  }, [socket, setGame])

  React.useEffect(() => {
    if (account?._id) getLobby()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?._id])

  return (
    <MenuWrapperStyled>
      <MenuContentStyled>
        {account === null ? <Login account={account} setAccount={setAccount} /> : (
          <>
            <h1>Cloak of Deceit</h1>
            <button onClick={logout}>log out</button>
            {lobby !== null && currPlayer ? (
              <>
                <div>
                  <LobbyCodeStyled>Code: <b>{lobby.code}</b></LobbyCodeStyled>
                  <CopyStyled onClick={() => navigator.clipboard.writeText(lobby.code)}>copy</CopyStyled>
                </div>
                <PlayersWrapperStyled>
                  {lobby.players.map((player, index: number) => (
                    <PlayerWrapperStyled key={index} $myself={player._id === account._id}>
                      <span>{player.username}</span>
                      {player.leader && <LeaderStyled>leader</LeaderStyled>}
                      {currPlayer.leader && player.socketId !== currPlayer.socketId && <KickStyled onClick={() => kickPlayer(player._id)}>kick</KickStyled>}
                    </PlayerWrapperStyled>
                  ))}
                </PlayersWrapperStyled>
                <button onClick={leaveLobby}>leave lobby</button>
                {currPlayer.leader && <button onClick={startGame}>start game</button>}
              </>
            ) : (
              <>
                <JoinWrapperStyled>
                  <input ref={codeRef} placeholder='Lobby code' onInput={({ target }: any) => target.value = target.value.toUpperCase()} maxLength={6} />
                  <button onClick={joinLobby}>join lobby</button>
                </JoinWrapperStyled>
                <CreateLobbyButtonStyled onClick={createLobby}>create lobby</CreateLobbyButtonStyled>
              </>
            )}
          </>
        )}
      </MenuContentStyled>
    </MenuWrapperStyled>
  )
}
