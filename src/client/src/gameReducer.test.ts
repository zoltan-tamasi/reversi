import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BLACK, WHITE, replay, type EventTypes, type GameEvent } from '@reversi/shared';

import { emptyGameState, gameReducer, type ClientGameState } from './gameReducer';

const ev = (seq: number, event: EventTypes): GameEvent =>
  ({ ...event, seq, timestamp: 0, initiatedBy: 'someone' }) as GameEvent;

const log: GameEvent[] = [
  ev(0, { type: 'JOIN', player: BLACK }),
  ev(1, { type: 'JOIN', player: WHITE }),
  ev(2, { type: 'START' }),
  ev(3, { type: 'MOVE', player: BLACK, row: 2, col: 3 }),
  ev(4, { type: 'MESSAGE', player: WHITE, senderName: 'white', message: 'hi' }),
  ev(5, { type: 'MOVE', player: WHITE, row: 2, col: 2 })
];

const loaded = (count: number): ClientGameState =>
  gameReducer(emptyGameState, { type: 'LOADED', gameId: 'g', events: log.slice(0, count) });

test('applying events one by one matches a full replay', () => {
  let state = loaded(3);
  for (const event of log.slice(3)) {
    state = gameReducer(state, { type: 'EVENTS', events: [event] });
  }
  assert.deepEqual(state.game, replay('g', log));
  assert.deepEqual(state.messages, [{ sender: 'white', text: 'hi' }]);
  assert.equal(state.nextSeq, 6);
  assert.equal(state.needsResync, false);
});

test('repeated events are ignored', () => {
  const state = loaded(4);
  assert.equal(gameReducer(state, { type: 'EVENTS', events: [log[3]] }), state);
});

test('a gap requests a resync and further events wait for it', () => {
  const gapped = gameReducer(loaded(3), { type: 'EVENTS', events: [log[4]] });
  assert.equal(gapped.needsResync, true);
  assert.equal(gapped.nextSeq, 3);
  assert.equal(gameReducer(gapped, { type: 'EVENTS', events: [log[3]] }), gapped);

  const resynced = gameReducer(gapped, { type: 'LOADED', gameId: 'g', events: log });
  assert.equal(resynced.needsResync, false);
  assert.deepEqual(resynced.game, replay('g', log));
  assert.equal(resynced.messages.length, 1);
});

test('an event that cannot be applied requests a resync', () => {
  const illegal = ev(3, { type: 'MOVE', player: BLACK, row: 0, col: 0 });
  const state = gameReducer(loaded(3), { type: 'EVENTS', events: [illegal] });
  assert.equal(state.needsResync, true);
  assert.equal(state.nextSeq, 3);
});

test('an older log does not undo events received meanwhile', () => {
  const ahead = gameReducer(loaded(3), { type: 'EVENTS', events: log.slice(3) });
  const state = gameReducer(ahead, { type: 'LOADED', gameId: 'g', events: log.slice(0, 4) });
  assert.equal(state, ahead);
});

test('loading another game rebuilds, reset clears', () => {
  const other = gameReducer(loaded(6), { type: 'LOADED', gameId: 'h', events: log.slice(0, 2) });
  assert.equal(other.game?.id, 'h');
  assert.equal(other.nextSeq, 2);
  assert.equal(other.messages.length, 0);
  assert.equal(gameReducer(other, { type: 'RESET' }), emptyGameState);
});
