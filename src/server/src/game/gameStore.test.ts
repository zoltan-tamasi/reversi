import assert from 'node:assert/strict';
import { test } from 'node:test';

import { legalMoves, replay } from '@reversi/shared';
import type { Game } from '@reversi/shared';

import {
  addMessage,
  createGame,
  getPlayer,
  joinGame,
  leaveGame,
  makeMove,
  registerPlayer
} from '../gameStore';

let playerCount = 0;

// Player names must be unique across the whole store.
function newPlayer(name: string) {
  const response = registerPlayer(`${name} ${++playerCount}`);
  if (!response.success) {
    throw new Error(response.error);
  }
  return response.data;
}

function assertReplayMatches(game: Game) {
  const { events, ...state } = game;
  assert.deepEqual(replay(game.id, events), state);
}

test('createGame creates a new game with the correct initial state', () => {
  const game = createGame('user1ID');
  assert.equal(game.status, 'WAITING_FOR_PLAYERS');
  assert.equal(game.blackPlayer, 'user1ID');
  assert.equal(game.whitePlayer, '');
});

test('the player who creates a game is assigned black', () => {
  const creator = newPlayer('Creator');
  const game = createGame(creator.id);
  assert.equal(getPlayer(creator.id)?.currentGameId, game.id);
  assert.equal(getPlayer(creator.id)?.color, 'BLACK');
});

test('the player who joins a game is assigned white', () => {
  const creator = newPlayer('Creator');
  const joiner = newPlayer('Joiner');
  const game = createGame(creator.id);
  joinGame(game.id, joiner.id);
  assert.equal(getPlayer(joiner.id)?.currentGameId, game.id);
  assert.equal(getPlayer(joiner.id)?.color, 'WHITE');
  assert.equal(getPlayer(creator.id)?.color, 'BLACK');
});

test('joining a game that already has two players only watches it', () => {
  const creator = newPlayer('Creator');
  const joiner = newPlayer('Joiner');
  const watcher = newPlayer('Watcher');
  const game = createGame(creator.id);
  joinGame(game.id, joiner.id);
  joinGame(game.id, watcher.id);
  assert.equal(getPlayer(watcher.id)?.currentGameId, game.id);
  assert.equal(getPlayer(watcher.id)?.color, null);
});
test('leaving a game clears the player\'s current game but keeps their seat', () => {
  const creator = newPlayer('Creator');
  const game = createGame(creator.id);
  leaveGame(creator.id);
  assert.equal(getPlayer(creator.id)?.currentGameId, null);
  assert.equal(getPlayer(creator.id)?.color, null);
  assert.equal(game.blackPlayer, creator.id);
  joinGame(game.id, creator.id);
  assert.equal(getPlayer(creator.id)?.currentGameId, game.id);
  assert.equal(getPlayer(creator.id)?.color, 'BLACK');
});

test('every join is recorded, including the creator, rejoins and spectators', () => {
  const creator = newPlayer('Creator');
  const joiner = newPlayer('Joiner');
  const watcher = newPlayer('Watcher');
  const game = createGame(creator.id);
  joinGame(game.id, joiner.id);
  joinGame(game.id, watcher.id);
  joinGame(game.id, creator.id);
  assert.deepEqual(
    game.events.map(({ seq, type, initiatedBy, ...rest }) => [seq, type, initiatedBy, 'player' in rest ? rest.player : undefined]),
    [
      [0, 'JOIN', creator.id, 'BLACK'],
      [1, 'JOIN', joiner.id, 'WHITE'],
      [2, 'START', joiner.id, undefined],
      [3, 'JOIN', watcher.id, null],
      [4, 'JOIN', creator.id, 'BLACK']
    ]
  );
});

test('messages are recorded with the sender\'s name, with or without a seat', () => {
  const creator = newPlayer('Creator');
  const watcher = newPlayer('Watcher');
  const game = createGame(creator.id);
  addMessage(game.id, creator.id, 'hello');
  addMessage(game.id, watcher.id, 'hi');
  assert.deepEqual(
    game.events.flatMap((event) => (event.type === 'MESSAGE' ? [[event.senderName, event.player, event.message]] : [])),
    [
      [creator.name, 'BLACK', 'hello'],
      [watcher.name, null, 'hi']
    ]
  );
});

test('a message to an unknown game is rejected', () => {
  assert.throws(() => addMessage('no-such-game', newPlayer('Creator').id, 'hello'), /Game not found/);
});

test('replaying the events reproduces the game after every event of a full game', () => {
  const black = newPlayer('Black');
  const white = newPlayer('White');
  const watcher = newPlayer('Watcher');
  const game = createGame(black.id);
  assertReplayMatches(game);
  joinGame(game.id, white.id);
  assertReplayMatches(game);
  joinGame(game.id, watcher.id);
  addMessage(game.id, watcher.id, 'good luck');
  assertReplayMatches(game);

  while (game.status === 'IN_PROGRESS') {
    const player = game.playerToTakeNextMove === 'BLACK' ? black : white;
    const [move] = legalMoves(game.board, game.playerToTakeNextMove);
    makeMove(game.id, player.id, move.row, move.col);
    assertReplayMatches(game);
  }

  assert.equal(game.status, 'FINISHED');
  assert.equal(game.events.at(-1)?.type, 'END');
  assert.deepEqual(game.events.map((event) => event.seq), game.events.map((_event, index) => index));
});
