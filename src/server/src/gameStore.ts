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
import type { Game } from './game/reversi.js';

export type Player = {
  id: string;
  name: string;
}

const players = new Map<string, Player>();
const games = new Map<string, Game>();

export function registerPlayer(name: string): Player {
  const player: Player = {
    id: randomUUID(),
    name
  };

  players.set(player.id, player);
  return player;
}

export function getPlayer(id: string): Player | null {
  return players.get(id) ?? null;
}

export function createGame(userId: string): Game {
  const game: Game = {
    id: randomUUID(),
    board: createBoard(),
    blackPlayer: userId,
    whitePlayer: '',
    playerToTakeNextMove: BLACK,
    status: 'WAITING_FOR_PLAYERS'
  };
  games.set(game.id, game);
  return game;
}

export function getGame(id: string): Game | null {
  return games.get(id) ?? null;
}

export function makeMove(id: string, row: number, col: number): Game {
  const game = requireGame(id);
  game.board = applyMove(game.board, row, col, game.playerToTakeNextMove);
  advanceTurn(game);
  return game;
}

export function passMove(id: string): Game {
  const game = requireGame(id);
  if (legalMoves(game.board, game.playerToTakeNextMove).length > 0) {
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

function advanceTurn(game: Game): void {
  const next = opponent(game.playerToTakeNextMove);
  if (legalMoves(game.board, next).length > 0) {
    game.playerToTakeNextMove = next;
  }
}

