// In-memory store of active games. Swap this out for a database-backed
// implementation later — the resolvers only depend on the methods below.

import { randomUUID } from 'node:crypto';
import {
  BLACK,
  WHITE,
  applyMove,
  isGameOver,
  createBoard,
  legalMoves,
  nextTurn,
  winner
} from '@reversi/shared';
import type { EventTypes, Game, Player as Color } from '@reversi/shared';
import { ErrorType } from './resolvers.js';

export type PlayerSettings = {
  // Whether the board marks the cells where the player can move.
  displayLegalMoves: boolean;
}

export const defaultSettings = (): PlayerSettings => ({
  displayLegalMoves: true
});

export type Player = {
  id: string;
  name: string;
  currentGameId: string | null;
  color: Color | null;
  settings: PlayerSettings;
}

export type Response<T> = SuccessResponse<T> | ErrorResponse;

export type SuccessResponse<T> = {
  success: true;
  data: T;
  error: null;
}

export type ErrorResponse = {
  success: false;
  data: null;
  error: ErrorType;
}

const playerNames = new Set<string>();
const players = new Map<string, Player>();
const games = new Map<string, Game>();

export function registerPlayer(name: string): Response<Player> {
  if (playerNames.has(name)) {
    return {
      success: false,
      data: null,
      error: 'PLAYER_NAME_ALREADY_EXISTS'
    };
  }
  playerNames.add(name);
  const player: Player = {
    id: randomUUID(),
    name,
    currentGameId: null,
    color: null,
    settings: defaultSettings()
  };

  players.set(player.id, player);
  return {
    success: true,
    data: player,
    error: null
  };
}

export function getPlayer(id: string): Player | null {
  return players.get(id) ?? null;
}

// Updates the given settings, leaving the omitted ones unchanged.
export function updateSettings(playerId: string, settings: Partial<PlayerSettings>): Player {
  const player = players.get(playerId);
  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }
  const changes = Object.fromEntries(
    Object.entries(settings).filter(([, value]) => value !== undefined && value !== null)
  );
  player.settings = { ...player.settings, ...changes };
  return player;
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
  recordEvent(game, userId, { type: 'JOIN', player: BLACK });
  return game;
}

export function getGame(id: string): Game | null {
  return games.get(id) ?? null;
}

// The first other player to join takes white and starts the game. Anyone
// joining after that (or either player rejoining) just observes.
export function joinGame(id: string, playerId: string): Game {
  const game = requireGame(id);
  const starting = game.status === 'WAITING_FOR_PLAYERS' && playerId !== game.blackPlayer;
  if (starting) {
    game.whitePlayer = playerId;
    game.status = 'IN_PROGRESS';
    console.log(`Game ${id} started: black=${game.blackPlayer}, white=${game.whitePlayer}`);
  }
  const color = seatColor(game, playerId);
  assignToGame(playerId, id, color);
  recordEvent(game, playerId, { type: 'JOIN', player: color });
  if (starting) {
    recordEvent(game, playerId, { type: 'START' });
  }
  return game;
}

export function addMessage(id: string, playerId: string, message: string): Game {
  const game = requireGame(id);
  recordEvent(game, playerId, {
    type: 'MESSAGE',
    player: seatColor(game, playerId),
    senderName: players.get(playerId)?.name ?? null,
    message
  });
  return game;
}

function seatColor(game: Game, playerId: string): Color | null {
  return playerId === game.blackPlayer ? BLACK : playerId === game.whitePlayer ? WHITE : null;
}

function recordEvent(game: Game, initiatedBy: string, event: EventTypes): void {
  game.events.push({ ...event, seq: game.events.length, timestamp: Date.now(), initiatedBy });
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
  const player = game.playerToTakeNextMove;
  game.board = applyMove(game.board, row, col, player);
  recordEvent(game, playerId, { type: 'MOVE', player, row, col });
  advanceTurn(game, playerId);
  return game;
}

export function passMove(id: string, playerId: string): Game {
  const game = requireGame(id);
  requireTurn(game, playerId);
  if (legalMoves(game.board, game.playerToTakeNextMove).length > 0) {
    throw new Error('Cannot pass while a legal move is available');
  }
  recordEvent(game, playerId, { type: 'PASS', player: game.playerToTakeNextMove });
  advanceTurn(game, playerId);
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

function advanceTurn(game: Game, playerId: string): void {
  game.playerToTakeNextMove = nextTurn(game.board, game.playerToTakeNextMove);
  if (isGameOver(game.board)) {
    game.status = 'FINISHED';
    game.winner = winner(game.board);
    recordEvent(game, playerId, { type: 'END', winner: game.winner });
  }
}

