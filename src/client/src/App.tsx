import { useMutation, useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';

import Board from './components/Board';
import GameInfo from './components/GameInfo';
import { GET_GAME, MAKE_MOVE, NEW_GAME, PASS_MOVE, type Game } from './graphql';

export default function App() {
  const [gameId, setGameId] = useState<string | null>(null);

  const [newGame, { loading: creating }] = useMutation<{ newGame: { id: string } }>(NEW_GAME, {
    onCompleted: (result) => setGameId(result.newGame.id)
  });

  const { data } = useQuery<{ game: Game | null }>(GET_GAME, {
    variables: { id: gameId ?? '' },
    skip: !gameId
  });

  const [makeMove] = useMutation<{ makeMove: Game }>(MAKE_MOVE);
  const [passMove] = useMutation<{ passMove: Game }>(PASS_MOVE);

  useEffect(() => {
    newGame({ variables: { userId: 'some-user-id' } });
  }, [newGame]);

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

  return (
    <main className="app">
      <h1>Reversi</h1>
      {!game && creating ? (
        <p>Starting game…</p>
      ) : (
        <>
          Game ID: {game?.id ?? 'unknown'}
          <GameInfo game={game} onNewGame={() => newGame()} onPass={onPass} />
          <Board game={game} onPlay={onPlay} />
        </>
      )}
    </main>
  );
}
