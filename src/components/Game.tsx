import React from 'react';
import { Game as GameType } from 'phaser';
import { Socket } from 'socket.io-client';

export default function Game({ socket, account, game }: { socket: Socket, account: any, game: any }) {
  const isDevelopment = process?.env?.NODE_ENV !== 'production';
  const [phaserGame, setPhaserGame] = React.useState<GameType>();

  React.useEffect(() => {
    const initPhaser = async () => {
      const Phaser = await import('phaser');
      const { Room } = await import('@/scenes/Room');

      const phaserGame = new Phaser.Game({
        type: Phaser.AUTO,
        parent: 'example',
        width: window.innerWidth,
        height: window.innerHeight,
        scale: {
          mode: Phaser.Scale.RESIZE,
          width: '100%',
          height: '100%'
        },
        physics: {
          default: 'arcade',
          arcade: {
            debug: isDevelopment,
            gravity: { y: 0, x: 0 },
          },
        },
        scene: [Room],
        callbacks: {
          preBoot: (phaserGame) => phaserGame.registry.merge({ socket, account, dbGame: game })
        }
      });

      setPhaserGame(phaserGame);
    };

    if (!phaserGame) initPhaser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  React.useEffect(() => {
    const handleResize = () =>
      phaserGame && phaserGame.scale.resize(window.innerWidth, window.innerHeight);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [phaserGame]);

  return <main style={{ display: 'flex' }} id='example'></main>;
}
