import { useMutation, useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';

import Board from './components/Board.jsx';
import GameInfo from './components/GameInfo.jsx';
import { GET_GAME, MAKE_MOVE, NEW_GAME, PASS_MOVE } from './graphql.js';

export default function App() {
  const [gameId, setGameId] = useState(null);

  const [newGame, { loading: creating }] = useMutation(NEW_GAME, {
    onCompleted: (result) => setGameId(result.newGame.id)
  });

  // Mutations return the full Game with the same id, so Apollo's normalized
  // cache updates this query automatically — no manual refetch needed.
  const { data } = useQuery(GET_GAME, {
    variables: { id: gameId },
    skip: !gameId
  });

  const [makeMove] = useMutation(MAKE_MOVE);
  const [passMove] = useMutation(PASS_MOVE);

  // Start a fresh game on first load.
  useEffect(() => {
    newGame();
  }, [newGame]);

  const game = data?.game ?? null;

  function onPlay(row, col) {
    if (game) makeMove({ variables: { gameId: game.id, row, col } });
  }

  function onPass() {
    if (game) passMove({ variables: { gameId: game.id } });
  }

  return (
    <main className="app">
      <h1>Reversi</h1>
      {!game && creating ? (
        <p>Starting game…</p>
      ) : (
        <>
          <GameInfo game={game} onNewGame={() => newGame()} onPass={onPass} />
          <Board game={game} onPlay={onPlay} />
        </>
      )}
    </main>
  );
}
