import { useMutation, useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';

import Board from './components/Board';
import GameInfo from './components/GameInfo';
import {
  GET_GAME,
  MAKE_MOVE,
  NEW_GAME,
  PASS_MOVE,
  REGISTER_PLAYER,
  type Game
} from './graphql';

type UIStatus = 'NOT_REGISTERED' | 'NOT_STARTED' | 'IN_GAME';

export default function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('Player 1');
  const [uiStatus, setUiStatus] = useState<UIStatus>('NOT_REGISTERED');
  const [gameToJoinId, setGameToJoinId] = useState<string | null>(null);

  const [registerPlayer] = useMutation<{ registerPlayer: { id: string } }>(REGISTER_PLAYER, {
    onCompleted: (result) => {
      setUserId(result.registerPlayer.id);
      setUiStatus('NOT_STARTED');
    }
  });

  const [newGame, { loading: creating }] = useMutation<{ newGame: { id: string } }>(NEW_GAME, {
    onCompleted: (result) => {
      setGameId(result.newGame.id);
      setUiStatus('IN_GAME');
    }
  });

  const { data } = useQuery<{ game: Game | null }>(GET_GAME, {
    variables: { id: gameId ?? '' },
    skip: !gameId
  });

  const [makeMove] = useMutation<{ makeMove: Game }>(MAKE_MOVE);
  const [passMove] = useMutation<{ passMove: Game }>(PASS_MOVE);

  /*useEffect(() => {
    if (uiStatus === 'NOT_STARTED' && !gameId) {
      void newGame();
    }
  }, [gameId, newGame, uiStatus]);*/

  const game = data?.game ?? null;

  function onPlay(row: number, col: number) {
    if (game) {
      void makeMove({ variables: { gameId: game.id, row, col } });
    }
  }

  function onPass() {
    if (game) {
      void passMove({ variables: { gameId: game.id } });
    }
  }

  function onRegister() {
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      return;
    }

    void registerPlayer({ variables: { name: trimmedName } });
  }

  const joinGame = (id: string | null) => {
    if (!gameId) {
      return;
    } 
  }

  return (
    <main className="app">
      <h1>Reversi</h1>
      {uiStatus === 'NOT_REGISTERED' ? (
        <div>
          <label>
            Player name
            <input
              type="text"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
            />
          </label>
          <button type="button" onClick={onRegister}>
            Register player
          </button>
        </div>
      ) : null}
      {uiStatus === 'NOT_STARTED' ? (
        <>
          {userId ? <p>Logged in as: {playerName}</p> : null}
          <button type="button" onClick={() => newGame()} disabled={creating}>
            Start new game
          </button>
          <label>
            Game ID
            <input
              type="text"
              onChange={(event) => {
                setGameToJoinId(event.target.value);
              }}
            />
          </label>
          <button type="button" onClick={() => joinGame(gameToJoinId)} disabled={creating}>
            Join game
          </button>
        </>
      ) : null}
      {uiStatus === 'IN_GAME' ? (
        <>
          {!game && creating ? (
            <p>Starting game…</p>
          ) : (
            <>
              Game ID: {game?.id ?? 'unknown'}
              <GameInfo game={game} onNewGame={() => newGame()} onPass={onPass} />
              <Board game={game} onPlay={onPlay} />
            </>
          )}
        </>
      ) : null}
    </main>
  );
}
