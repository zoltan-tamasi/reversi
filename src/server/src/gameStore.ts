// In-memory store of active games. Swap this out for a database-backed
// implementation later — the resolvers only depend on the methods below.

import { randomUUID } from 'node:crypto';
import {
  BLACK,
  WHITE,
  applyMove,
  createBoard,
  legalMoves,
  opponent,
  winner
} from './game/reversi.js';
import type { Game, Player as Color } from './game/reversi.js';

export type Player = {
  id: string;
  name: string;
  currentGameId: string | null;
  color: Color | null;
}

const players = new Map<string, Player>();
const games = new Map<string, Game>();

export function registerPlayer(name: string): Player {
  const player: Player = {
    id: randomUUID(),
    name,
    currentGameId: null,
    color: null
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
    status: 'WAITING_FOR_PLAYERS',
    events: []
  };
  games.set(game.id, game);
  // Whoever creates a game always plays black.
  assignToGame(userId, game.id, BLACK);
  return game;
}

export function getGame(id: string): Game | null {
  return games.get(id) ?? null;
}

// The first other player to join takes white and starts the game. Anyone
// joining after that (or either player rejoining) just observes.
export function joinGame(id: string, playerId: string): Game {
  const game = requireGame(id);
  if (game.status === 'WAITING_FOR_PLAYERS' && playerId !== game.blackPlayer) {
    game.whitePlayer = playerId;
    game.status = 'IN_PROGRESS';
    console.log(`Game ${id} started: black=${game.blackPlayer}, white=${game.whitePlayer}`);
  }
  const color = playerId === game.blackPlayer ? BLACK : playerId === game.whitePlayer ? WHITE : null;
  assignToGame(playerId, id, color);
  return game;
}

// Detaches the player from their current game so a restored session no
// longer returns them to it. The game itself is unaffected, so the player can
// rejoin it by ID and keep their seat.
export function leaveGame(playerId: string): void {
  assignToGame(playerId, null, null);
}

function assignToGame(playerId: string, gameId: string | null, color: Color | null): void {
  const player = players.get(playerId);
  if (player) {
    player.currentGameId = gameId;
    player.color = color;
  }
}

export function makeMove(id: string, playerId: string, row: number, col: number): Game {
  const game = requireGame(id);
  requireTurn(game, playerId);
  game.board = applyMove(game.board, row, col, game.playerToTakeNextMove);
  advanceTurn(game);
  return game;
}

export function passMove(id: string, playerId: string): Game {
  const game = requireGame(id);
  requireTurn(game, playerId);
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

function requireTurn(game: Game, playerId: string): void {
  if (game.status !== 'IN_PROGRESS') {
    throw new Error('Game is not in progress');
  }
  const playerToMove = game.playerToTakeNextMove === BLACK ? game.blackPlayer : game.whitePlayer;
  if (playerId !== playerToMove) {
    throw new Error('It is not your turn');
  }
}

function advanceTurn(game: Game): void {
  const next = opponent(game.playerToTakeNextMove);
  if (legalMoves(game.board, next).length > 0) {
    game.playerToTakeNextMove = next;
  } else if (legalMoves(game.board, game.playerToTakeNextMove).length === 0) {
    // Neither side can move, so the game is over.
    game.status = 'FINISHED';
    game.winner = winner(game.board);
  }
}

