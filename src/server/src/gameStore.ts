// In-memory store of active games. Swap this out for a database-backed
// implementation later — the resolvers only depend on the methods below.

import { randomUUID } from 'node:crypto';
import {
  BLACK,
  applyMove,
  createBoard,
  legalMoves,
  opponent
} from './game/reversi.js';
import type { Board, Player } from './game/reversi.js';

export interface Game {
  id: string;
  board: Board;
  currentPlayer: Player;
}

const games = new Map<string, Game>();

export function createGame(): Game {
  const game: Game = {
    id: randomUUID(),
    board: createBoard(),
    currentPlayer: BLACK // black always moves first
  };
  games.set(game.id, game);
  return game;
}

export function getGame(id: string): Game | null {
  return games.get(id) ?? null;
}

export function makeMove(id: string, row: number, col: number): Game {
  const game = requireGame(id);
  game.board = applyMove(game.board, row, col, game.currentPlayer);
  advanceTurn(game);
  return game;
}

export function passMove(id: string): Game {
  const game = requireGame(id);
  if (legalMoves(game.board, game.currentPlayer).length > 0) {
    throw new Error('Cannot pass while a legal move is available');
  }
  advanceTurn(game);
  return game;
}

function requireGame(id: string): Game {
  const game = games.get(id);
  if (!game) {
    throw new Error(`Game not found: ${id}`);
  }
  return game;
}

// Hand the turn to the opponent, but skip them if they have no legal move.
function advanceTurn(game: Game): void {
  const next = opponent(game.currentPlayer);
  if (legalMoves(game.board, next).length > 0) {
    game.currentPlayer = next;
  }
  // If the opponent has no move, the turn stays with the current player.
  // If neither has a move the game is finished (reported by the resolvers).
}
