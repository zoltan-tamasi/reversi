import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { useEffect, useState } from 'react';

import Board from './components/Board';
import GameInfo from './components/GameInfo';
import {
  GET_GAME,
  MAKE_MOVE,
  NEW_GAME,
  PASS_MOVE,
  REGISTER_PLAYER,
  JOIN_GAME,
  type Game
} from './graphql';

type UIStatus = 'NOT_REGISTERED' | 'NOT_STARTED' | 'IN_GAME';

const GameObserver: React.FC<{ gameId: string | null, userId: string | null }> = (props) => {
  const [accumulatedData, setAccumulatedData] = useState([]);
  const { data, loading } = useSubscription(JOIN_GAME, {
    variables: { gameId: props.gameId ?? '', playerId: props.userId ?? '' },
    onError: (error) => {
      console.error('Subscription error:', error);
    },
    onData({ data }) {
      console.log(data);
      //setAccumulatedData((prevData) => [...prevData, data]);
    },
  });

  return loading ? <p>Loading subscription...</p> : <p>Subscription active. Data received: {JSON.stringify(data)}</p>;

};

export default function App() {
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    },
    onError: (error) => {
      console.error('Error starting new game:', error);
    } 
  });

  const { data } = useQuery<{ game: Game | null }>(GET_GAME, {
    variables: { id: gameId ?? '' },
    skip: !gameId
  });

  const [makeMove] = useMutation<{ makeMove: Game }>(MAKE_MOVE);
  const [passMove] = useMutation<{ passMove: Game }>(PASS_MOVE);
  const [accumulatedData, setAccumulatedData] = useState([]);
  // const { data: data2 } = useSubscription(JOIN_GAME, {
  //   variables: { gameId: gameToJoinId ?? '', playerId: userId ?? '' },
  //   onError: (error) => {
  //     console.error('Subscription error:', error);
  //   },
  //   onData({ data: data2 }) {
  //     console.log(data2)
  //   },
  // });

  useEffect(() => {
    /*if (uiStatus === 'NOT_STARTED' && !gameId) {
        newGame({ variables: { userId: userId } });
    }*/
  }, []);

  const game = data?.game ?? null;

  //const document = data2?.documentUpdated || data2?.document;

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
    if (!gameToJoinId) {
      console.log('No game ID provided for joining a game.');
      return;
    } 
    setUiStatus('IN_GAME');
    setGameId(id);
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
          <button type="button" onClick={() => {
            newGame({ variables: { userId: userId } });
          }} disabled={creating}>
            Start new game
          </button>
          <label>
            Game ID
            <input
              type="text"
              onChange={(event) => {
                console.log('Game ID to join:', event.target.value);
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
          <GameObserver gameId={gameToJoinId} userId={userId}/>
          {!game && creating ? (
            <p>Starting game…</p>
          ) : (
            <>
              {loading ? <p>Loading...</p> : <p>Game loaded.</p>}
              Game ID: {game?.id ?? 'unknown'}
              <GameInfo game={game} onNewGame={() => {
                newGame({ variables: { userId: userId } });
              }} onPass={onPass} />
              <Board game={game} onPlay={onPlay} />
            </>
          )}
        </>
      ) : null}
    </main>
  );
}
