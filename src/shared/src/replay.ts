// Rebuilds a game's state from its event log. Pure functions, so the client
// can derive everything it shows from the events it holds in memory.

import { BLACK, WHITE, applyMove, createBoard, nextTurn } from './reversi.js';
import type { Game, GameEvent } from './reversi.js';

export type GameState = Omit<Game, 'events'>;

export function initialGameState(id: string): GameState {
  return {
    id,
    status: 'WAITING_FOR_PLAYERS',
    board: createBoard(),
    blackPlayer: '',
    whitePlayer: '',
    playerToTakeNextMove: BLACK
  };
}

export function applyEvent(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'JOIN':
      // Spectators have no color, so they leave the seats untouched.
      if (event.player === BLACK) return { ...state, blackPlayer: event.initiatedBy };
      if (event.player === WHITE) return { ...state, whitePlayer: event.initiatedBy };
      return state;
    case 'START':
      return { ...state, status: 'IN_PROGRESS' };
    case 'MOVE': {
      const board = applyMove(state.board, event.row, event.col, event.player);
      return { ...state, board, playerToTakeNextMove: nextTurn(board, event.player) };
    }
    case 'PASS':
      return { ...state, playerToTakeNextMove: nextTurn(state.board, event.player) };
    case 'MESSAGE':
      return state;
    case 'END':
      return { ...state, status: 'FINISHED', winner: event.winner };
  }
}

export function replay(id: string, events: GameEvent[]): GameState {
  return events.reduce(applyEvent, initialGameState(id));
}
