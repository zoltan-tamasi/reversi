import { applyEvent, initialGameState, legalMoves, replay, scores, type GameState } from '@reversi/shared';

import type { ChatMessage, Game, GameEvent } from './graphql';

// The client keeps only the current state of the game, not its event log.
// Each incoming event is applied to the previous state.
export type ClientGameState = {
  game: GameState | null;
  messages: ChatMessage[];
  // The seq of the next event expected. An event's seq is its position in the log.
  nextSeq: number;
  // Set when an event arrived out of order (or could not be applied); the
  // observer then reloads the full event log from the server.
  needsResync: boolean;
};

export type GameAction =
  // Clears the game, e.g. after leaving it or before starting a new one.
  | { type: 'RESET' }
  // The game's full event log, loaded from the server.
  | { type: 'LOADED'; gameId: string; events: GameEvent[] }
  // Events received through the subscription.
  | { type: 'EVENTS'; events: GameEvent[] };

export const emptyGameState: ClientGameState = {
  game: null,
  messages: [],
  nextSeq: 0,
  needsResync: false
};

function messagesFrom(events: GameEvent[]): ChatMessage[] {
  return events.flatMap((event) =>
    event.type === 'MESSAGE' ? [{ sender: event.senderName, text: event.message }] : []
  );
}

// Rebuilds the state from the full event log. The log comes from the server,
// so it is applied as is; a gap here would only trigger the same reload again.
function rebuild(gameId: string, events: GameEvent[]): ClientGameState {
  try {
    return {
      game: replay(gameId, events),
      messages: messagesFrom(events),
      nextSeq: events.length > 0 ? events[events.length - 1].seq + 1 : 0,
      needsResync: false
    };
  } catch (error) {
    console.error('Could not replay the game events:', error);
    return { ...emptyGameState, game: initialGameState(gameId) };
  }
}

// Applies the events following the current state. Repeats (e.g. after a
// reconnect) are skipped; a gap or an event that cannot be applied stops the
// update and asks for a resync.
function applyEvents(state: ClientGameState, events: GameEvent[]): ClientGameState {
  if (!state.game || state.needsResync) {
    return state;
  }
  let { game, messages, nextSeq } = state;
  for (const event of events) {
    if (event.seq < nextSeq) {
      continue;
    }
    if (event.seq > nextSeq) {
      console.warn(`Missing game events ${nextSeq}..${event.seq - 1}; resyncing.`);
      return { game, messages, nextSeq, needsResync: true };
    }
    try {
      game = applyEvent(game, event);
    } catch (error) {
      console.error(`Could not apply game event ${event.seq}; resyncing.`, error);
      return { game, messages, nextSeq, needsResync: true };
    }
    if (event.type === 'MESSAGE') {
      messages = [...messages, { sender: event.senderName, text: event.message }];
    }
    nextSeq = event.seq + 1;
  }
  return nextSeq === state.nextSeq ? state : { game, messages, nextSeq, needsResync: false };
}

export function gameReducer(state: ClientGameState, action: GameAction): ClientGameState {
  switch (action.type) {
    case 'RESET':
      return emptyGameState;
    case 'LOADED':
      // A full rebuild is only needed for a different game, a fresh one, or
      // a resync. Otherwise the log may be older than the state already held
      // (subscription events arrived meanwhile), so only newer events count.
      if (state.game?.id !== action.gameId || state.nextSeq === 0 || state.needsResync) {
        return rebuild(action.gameId, action.events);
      }
      return applyEvents(state, action.events);
    case 'EVENTS':
      return applyEvents(state, action.events);
  }
}

// legalMoves and scores depend only on the board, so they are derived for display.
export function toViewGame(state: GameState): Game {
  return {
    ...state,
    winner: state.winner ?? null,
    legalMoves: legalMoves(state.board, state.playerToTakeNextMove),
    scores: scores(state.board)
  };
}
