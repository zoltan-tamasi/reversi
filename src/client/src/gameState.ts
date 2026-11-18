import { legalMoves, replay, scores } from '@reversi/shared';

import type { ChatMessage, Game, GameEvent } from './graphql';

// Adds the events not held yet. An event's seq is its position in the log, so
// anything below the current length is a repeat (e.g. after a reconnect).
export function mergeEvents(current: GameEvent[], incoming: GameEvent[]): GameEvent[] {
  const fresh = incoming.filter((event) => event.seq >= current.length);
  return fresh.length > 0 ? [...current, ...fresh] : current;
}

export function gameFromEvents(id: string, events: GameEvent[]): Game {
  const state = replay(id, events);
  return {
    ...state,
    winner: state.winner ?? null,
    legalMoves: legalMoves(state.board, state.playerToTakeNextMove),
    scores: scores(state.board)
  };
}

export function chatMessagesFromEvents(events: GameEvent[]): ChatMessage[] {
  return events.flatMap((event) =>
    event.type === 'MESSAGE' ? [{ sender: event.senderName, text: event.message }] : []
  );
}
