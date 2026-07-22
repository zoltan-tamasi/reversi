import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BLACK,
  WHITE,
  applyMove,
  createBoard,
  flipsForMove,
  legalMoves,
  scores
} from './reversi.js';

test('starting position has four center discs', () => {
  const board = createBoard();
  assert.deepEqual(scores(board), { black: 2, white: 2 });
});

test('black has exactly four opening moves', () => {
  const moves = legalMoves(createBoard(), BLACK);
  assert.equal(moves.length, 4);
});

test('applying a move flips the flanked disc', () => {
  const board = createBoard();
  // Black plays (2, 3), flanking the white disc at (3, 3).
  const next = applyMove(board, 2, 3, BLACK);
  assert.equal(next[3][3], BLACK);
  assert.deepEqual(scores(next), { black: 4, white: 1 });
});

test('illegal moves flip nothing', () => {
  assert.equal(flipsForMove(createBoard(), 0, 0, BLACK).length, 0);
  assert.throws(() => applyMove(createBoard(), 0, 0, WHITE));
});
