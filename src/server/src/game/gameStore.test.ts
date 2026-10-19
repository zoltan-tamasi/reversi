import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createGame,
  getPlayer,
  joinGame,
  registerPlayer
} from '../gameStore';

test('createGame creates a new game with the correct initial state', () => {
  const game = createGame('user1ID');
  assert.equal(game.status, 'WAITING_FOR_PLAYERS');
  assert.equal(game.blackPlayer, 'user1ID');
  assert.equal(game.whitePlayer, '');
});

test('the player who creates a game is assigned black', () => {
  const creator = registerPlayer('Creator');
  const game = createGame(creator.id);
  assert.equal(getPlayer(creator.id)?.currentGameId, game.id);
  assert.equal(getPlayer(creator.id)?.color, 'BLACK');
});

test('the player who joins a game is assigned white', () => {
  const creator = registerPlayer('Creator');
  const joiner = registerPlayer('Joiner');
  const game = createGame(creator.id);
  joinGame(game.id, joiner.id);
  assert.equal(getPlayer(joiner.id)?.currentGameId, game.id);
  assert.equal(getPlayer(joiner.id)?.color, 'WHITE');
  assert.equal(getPlayer(creator.id)?.color, 'BLACK');
});

test('joining a game that already has two players only watches it', () => {
  const creator = registerPlayer('Creator');
  const joiner = registerPlayer('Joiner');
  const watcher = registerPlayer('Watcher');
  const game = createGame(creator.id);
  joinGame(game.id, joiner.id);
  joinGame(game.id, watcher.id);
  assert.equal(getPlayer(watcher.id)?.currentGameId, game.id);
  assert.equal(getPlayer(watcher.id)?.color, null);
});
