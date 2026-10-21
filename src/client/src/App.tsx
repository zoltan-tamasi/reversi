import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';

import Board from './components/Board';
import GameInfo from './components/GameInfo';
import {
  GET_GAME,
  MAKE_MOVE,
  NEW_GAME,
  PASS_MOVE,
  REGISTER_PLAYER,
  JOIN_GAME,
  type Game,
  SAY_HELLO,
  JOIN_AS_OPPONENT,
  LEAVE_GAME,
  RESTORE_USER_SESSION,
  type UserSession,
} from './graphql';
import { getAuthToken, setAuthToken } from './apollo';

type UIStatus = 'NOT_REGISTERED' | 'NOT_STARTED' | 'IN_GAME';

type ChatMessage = { sender: string | null; text: string };

type GameObserverProps = {
  gameId: string | null, 
  setGame: React.Dispatch<React.SetStateAction<Game | null>>,
  onMessage: (message: ChatMessage) => void
};

const GameObserver: React.FC<GameObserverProps> = (props) => {
  const { loading: gameLoading, error, data: gameData } = useQuery<{ game: Game | null }>(GET_GAME, {
    variables: { id: props.gameId ?? '' },
    skip: !props.gameId
  });
  const [game, setGame] = useState<Game | null>(null);
  const { data, loading } = useSubscription<{ joinGame: { game: Game | null; message: string | null; sender: string | null } }>(JOIN_GAME, {
    variables: { gameId: props.gameId ?? '' },
    onError: (error) => {
      console.error('Subscription error:', error);
    },
    onData({ data }) {
      console.log('Subscription data received:', data);
      const game = data.data?.joinGame.game;
      if (game) {
        props.setGame(game);
      }
      const message = data.data?.joinGame.message;
      if (message) {
        props.onMessage({ sender: data.data?.joinGame.sender ?? null, text: message });
      }
    },
  });

  useEffect(() => {
    if (gameData?.game) {
      setGame(gameData.game);
      props.setGame(gameData.game);
    }
  }, [gameData, props]);

  if (error) {
    console.error('Error loading subscription:', error);
  }

  
  console.log(loading ? "Loading subscription..." : `Subscription active. Last data received at: ${new Date().toLocaleTimeString()}`);
};

export default function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('Player 1');
  const [uiStatus, setUiStatus] = useState<UIStatus>('NOT_REGISTERED');
  const [gameToJoinId, setGameToJoinId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<ChatMessage[]>([]);
  const sessionRestored = useRef(false);

  // Restore the session from a stored token. If the server no longer knows
  // the token (e.g. it restarted), drop it and ask the user to register again.
  // The same query is refetched after creating or joining a game to pick up
  // the color the server assigned.
  const { loading: restoringSession, data: sessionData } = useQuery<{ restoreUserSession: UserSession | null }>(RESTORE_USER_SESSION, {
    skip: !getAuthToken(),
    fetchPolicy: 'network-only',
    onCompleted: (result) => {
      const session = result.restoreUserSession;
      if (session) {
        setPlayerName(session.player.name);
        setUiStatus((status) => (status === 'NOT_REGISTERED' ? 'NOT_STARTED' : status));
        // On page load, go straight back into the game the player was in.
        if (!sessionRestored.current && session.currentGameId) {
          setGameToJoinId(session.currentGameId);
          setGameId(session.currentGameId);
          setUiStatus('IN_GAME');
          setLoading(false);
        }
        sessionRestored.current = true;
      } else {
        setAuthToken(null);
      }
    }
  });

  const session = sessionData?.restoreUserSession;
  // Ignore a color that belongs to a game other than the one on screen.
  const myColor = session && game && session.currentGameId === game.id ? session.color : null;

  const [registerPlayer] = useMutation<{ registerPlayer: { token: string } }>(REGISTER_PLAYER, {
    onCompleted: (result) => {
      setAuthToken(result.registerPlayer.token);
      setUiStatus('NOT_STARTED');
    }
  });

  const [newGame, { loading: creating }] = useMutation<{ newGame: Game }>(NEW_GAME, {
    refetchQueries: [RESTORE_USER_SESSION],
    onCompleted: (result) => {
      const gameId = result.newGame.id;
      setGameToJoinId(gameId);
      setGameId(gameId);
      setGame(result.newGame);
      setReceivedMessages([]);
      setUiStatus('IN_GAME');
      setLoading(false);
    },
    onError: (error) => {
      console.error('Error starting new game:', error);
    } 
  });

  const [makeMove] = useMutation<{ makeMove: Game }>(MAKE_MOVE);
  const [passMove] = useMutation<{ passMove: Game }>(PASS_MOVE);
  const [sayHello] = useMutation<{ sayHello: boolean }>(SAY_HELLO);
  const [joinAsOpponent] = useMutation<{ joinAsOpponent: Game }>(JOIN_AS_OPPONENT, {
    refetchQueries: [RESTORE_USER_SESSION]
  });
  const [leaveGame] = useMutation<{ leaveGame: boolean }>(LEAVE_GAME, {
    refetchQueries: [RESTORE_USER_SESSION]
  });

  function onLeaveGame() {
    void leaveGame();
    setGame(null);
    setGameId(null);
    setGameToJoinId(null);
    setReceivedMessages([]);
    setUiStatus('NOT_STARTED');
  }

  function onSendMessage() {
    const text = message.trim();
    if (!text) {
      return;
    }
    sayHello({ variables: { gameId: gameToJoinId, message: text } });
    setMessage('');
  }

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
    sayHello({ variables: { gameId: id, message: "Hello, world!" } });
    joinAsOpponent({ variables: { gameId: id } });
  }

  return (
    <main className="app">
      <h1>Reversi</h1>
      {restoringSession ? <p>Restoring session…</p> : null}
      {uiStatus === 'NOT_REGISTERED' && !restoringSession ? (
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
          <p>Logged in as: {playerName}</p>
          <button type="button" onClick={() => {
            newGame();
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
          <GameObserver
            gameId={gameToJoinId}
            setGame={setGame}
            onMessage={(received) => setReceivedMessages((messages) => [...messages, received])}
          />
          <button type="button" onClick={() => newGame()}>
            New game
          </button>
          <button type="button" onClick={onLeaveGame}>
            Leave game
          </button>
          {!game && creating ? (
            <p>Starting game…</p>
          ) : (
            <>
              {loading ? <p>Loading...</p> : <p>Game loaded.</p>}
              Game ID: {game?.id ?? 'unknown'}
              <GameInfo game={game} myColor={myColor} onPass={onPass} />
              <div className="board-area">
                <Board game={game} myColor={myColor} onPlay={onPlay} />
                <div className="message-panel">
                  <button type="button" disabled={!message.trim()} onClick={onSendMessage}>
                    Send message
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        onSendMessage();
                      }
                    }}
                  />
                  <ul className="messages">
                    {receivedMessages.map((received, index) => (
                      <li key={index}>
                        <strong>{received.sender ?? 'Unknown'}:</strong> {received.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </>
      ) : null}
    </main>
  );
}
