import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createGame
} from '../gameStore';

test('createGame creates a new game with the correct initial state', () => {
  const game = createGame('user1ID');
  assert.equal(game.status, 'WAITING_FOR_PLAYERS');
  assert.equal(game.blackPlayer, 'user1ID');
  assert.equal(game.whitePlayer, '');
});
