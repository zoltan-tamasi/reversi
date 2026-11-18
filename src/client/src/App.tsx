import { useApolloClient, useMutation, useQuery, useSubscription } from '@apollo/client';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';

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
  type GameEvent,
  SAY_HELLO,
  JOIN_AS_OPPONENT,
  LEAVE_GAME,
  LOGOUT,
  RESTORE_USER_SESSION,
  type UserSession,
} from './graphql';
import { getAuthToken, setAuthToken } from './apollo';
import { emptyGameState, gameReducer, toViewGame, type GameAction } from './gameReducer';

export type ErrorType = 'PLAYER_NAME_ALREADY_EXISTS' | 'UNKNOWN_ERROR';

type UIStatus = 'NOT_REGISTERED' | 'NOT_STARTED' | 'IN_GAME';

type GameObserverProps = {
  gameId: string | null,
  needsResync: boolean,
  dispatch: React.Dispatch<GameAction>
};

// Loads the game's full event log, then subscribes to the events after it.
// Each event is dispatched to the game reducer, which applies it to the
// current state. When the reducer detects a gap, the log is loaded again.
const GameObserver: React.FC<GameObserverProps> = ({ gameId, needsResync, dispatch }): React.ReactNode => {
  const { error, data: gameData, refetch } = useQuery<{ game: { id: string; events: GameEvent[] } | null }>(GET_GAME, {
    variables: { id: gameId ?? '' },
    skip: !gameId,
    fetchPolicy: 'network-only'
  });
  const loadedGame = gameData?.game;
  const { loading } = useSubscription<{ joinGame: GameEvent }>(JOIN_GAME, {
    variables: { gameId: gameId ?? '', afterSeq: (loadedGame?.events.length ?? 0) - 1 },
    skip: !loadedGame,
    onError: (error) => {
      console.error('Subscription error:', error);
    },
    onData({ data }) {
      const event = data.data?.joinGame;
      if (event) {
        dispatch({ type: 'EVENTS', events: [event] });
      }
    },
  });

  useEffect(() => {
    if (loadedGame) {
      dispatch({ type: 'LOADED', gameId: loadedGame.id, events: loadedGame.events });
    }
  }, [loadedGame, dispatch]);

  // Dispatch from the refetch result too: if the log has not changed since
  // the last load, Apollo keeps the same data and the effect above won't run.
  useEffect(() => {
    if (!needsResync || !gameId) {
      return;
    }
    refetch()
      .then((result) => {
        const game = result.data.game;
        if (game) {
          dispatch({ type: 'LOADED', gameId: game.id, events: game.events });
        }
      })
      .catch((error) => console.error('Error resyncing game:', error));
  }, [needsResync, gameId, refetch, dispatch]);

  if (error) {
    console.error('Error loading game:', error);
  }

  console.log(loading ? "Loading subscription..." : `Subscription active. Last data received at: ${new Date().toLocaleTimeString()}`);

  return null; // This component does not render anything itself
};

export default function App() {
  const [gameState, dispatch] = useReducer(gameReducer, emptyGameState);
  const [loading, setLoading] = useState(true);
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('Player 1');
  const [uiStatus, setUiStatus] = useState<UIStatus>('NOT_REGISTERED');
  const [gameToJoinId, setGameToJoinId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [registerError, setRegisterError] = useState<ErrorType | null>(null);
  const sessionRestored = useRef(false);

  // The reducer holds the game's current state, updated event by event.
  const game = useMemo(
    () => (gameState.game && gameState.game.id === gameId ? toViewGame(gameState.game) : null),
    [gameState.game, gameId]
  );
  const receivedMessages = gameState.messages;

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

  const [registerPlayer] = useMutation<{ registerPlayer: { token: string; error: ErrorType | null } }>(REGISTER_PLAYER, {
    onCompleted: (result) => {
      if (result.registerPlayer.error !== null) {
        console.error('Error registering player:', result.registerPlayer.error);
        setRegisterError(result.registerPlayer.error);
        return;
      }

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
      dispatch({ type: 'RESET' });
      setUiStatus('IN_GAME');
      setLoading(false);
    },
    onError: (error) => {
      console.error('Error starting new game:', error);
    } 
  });

  const [makeMove] = useMutation<{ makeMove: boolean }>(MAKE_MOVE);
  const [passMove] = useMutation<{ passMove: boolean }>(PASS_MOVE);
  const [sayHello] = useMutation<{ sayHello: boolean }>(SAY_HELLO);
  const [joinAsOpponent] = useMutation<{ joinAsOpponent: Game }>(JOIN_AS_OPPONENT, {
    refetchQueries: [RESTORE_USER_SESSION]
  });
  const [leaveGame] = useMutation<{ leaveGame: boolean }>(LEAVE_GAME, {
    refetchQueries: [RESTORE_USER_SESSION]
  });

  const apolloClient = useApolloClient();
  const [logout] = useMutation<{ logout: boolean }>(LOGOUT);

  async function onLogout() {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
    setAuthToken(null);
    await apolloClient.clearStore();
    setUiStatus('NOT_REGISTERED');
  }

  function onLeaveGame() {
    void leaveGame();
    dispatch({ type: 'RESET' });
    setGameId(null);
    setGameToJoinId(null);
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
    dispatch({ type: 'RESET' });
    setUiStatus('IN_GAME');
    setGameId(id);
    sayHello({ variables: { gameId: id, message: "Hello, world!" } });
    joinAsOpponent({ variables: { gameId: id } });
  }

  return (
    <>
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-base-200 px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {uiStatus !== 'NOT_REGISTERED' ? (
            <>
              <p>Logged in as: <span className="font-semibold">{playerName}</span></p>
              {uiStatus === 'NOT_STARTED' ? (
                <button type="button" onClick={() => void onLogout()} className="btn btn-outline btn-sm">
                  Log out
                </button>
              ) : null}
            </>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold">Reversi</h1>
        <div />
      </header>
      <main className="mx-auto flex w-[min(90vw,480px)] flex-col gap-4 py-8 text-center">
        {restoringSession ? <p>Restoring session…</p> : null}
        {uiStatus === 'NOT_REGISTERED' && !restoringSession ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <label className={`input grow ${registerError ? 'input-error' : ''}`}>
                <span className="label">Player name</span>
                <input
                  type="text"
                  value={playerName}
                  onChange={(event) => {
                    setPlayerName(event.target.value);
                    setRegisterError(null);
                  }}
                />
              </label>
              <button type="button" onClick={onRegister} className="btn btn-primary">
                Register player
              </button>
            </div>
            {registerError ? (
              <p className="text-left text-error">
                {registerError === 'PLAYER_NAME_ALREADY_EXISTS'
                  ? 'This player name is already taken. Please choose another one.'
                  : 'Registration failed. Please try again.'}
              </p>
            ) : null}
          </div>
        ) : null}
        {uiStatus === 'NOT_STARTED' ? (
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => {
              newGame();
            }} disabled={creating} className="btn btn-primary">
              Start new game
            </button>
            <label className="input w-full">
              <span className="label">Game ID</span>
              <input
                type="text"
                onChange={(event) => {
                  console.log('Game ID to join:', event.target.value);
                  setGameToJoinId(event.target.value);
                }}
              />
            </label>
            <button type="button" onClick={() => joinGame(gameToJoinId)} disabled={creating} className="btn btn-primary">
              Join game
            </button>
          </div>
        ) : null}
        {uiStatus === 'IN_GAME' ? (
          <>
            <GameObserver
              gameId={gameToJoinId}
              needsResync={gameState.needsResync}
              dispatch={dispatch}
            />
            <div className="flex justify-center gap-2">
              <button type="button" onClick={onLeaveGame} className="btn btn-primary">
                Leave game
              </button>
            </div>
            {!game && creating ? (
              <p>Starting game…</p>
            ) : (
              <>
                {loading ? <p>Loading...</p> : <p>Game loaded.</p>}
                <p className="text-sm opacity-70">Game ID: <code>{game?.id ?? 'unknown'}</code></p>
                <GameInfo game={game} myColor={myColor} onPass={onPass} />
                <div className="relative">
                  <Board game={game} myColor={myColor} onPlay={onPlay} />
                  <div className="mt-4 flex flex-col gap-2 min-[960px]:absolute min-[960px]:top-0 min-[960px]:left-[calc(100%+1rem)] min-[960px]:mt-0 min-[960px]:w-[200px]">
                    <button type="button" disabled={!message.trim()} onClick={onSendMessage} className="btn btn-primary">
                      Send message
                    </button>
                    <input
                      type="text"
                      className="input w-full"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          onSendMessage();
                        }
                      }}
                    />
                    <ul className="max-h-[300px] overflow-y-auto text-left">
                      {receivedMessages.map((received, index) => (
                        <li key={index} className="border-b border-base-300 py-1 wrap-anywhere">
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
    </>
  );
}
