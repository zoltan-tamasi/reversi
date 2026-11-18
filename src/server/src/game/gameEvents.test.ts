import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PubSub } from 'graphql-subscriptions';
import type { GameEvent } from '@reversi/shared';

import { gameTopic, streamGameEvents } from '../gameEvents';
import { addMessage, createGame, joinGame } from '../gameStore';

const seqOf = (result: IteratorResult<{ joinGame: GameEvent }>) => result.value?.joinGame.seq;

test('streams only the recorded events after afterSeq', async () => {
  const game = createGame('black');
  joinGame(game.id, 'white');
  const stream = streamGameEvents(new PubSub(), game, 0);
  assert.equal(seqOf(await stream.next()), 1);
  assert.equal(seqOf(await stream.next()), 2);
  await stream.return?.();
});

test('streams events recorded after subscribing, in order and exactly once', async () => {
  const pubsub = new PubSub();
  const game = createGame('black');
  const stream = streamGameEvents(pubsub, game, 0);

  const pending = stream.next();
  joinGame(game.id, 'white');
  pubsub.publish(gameTopic(game.id), {});

  // The join records JOIN and START, but only one notification was published.
  assert.equal(seqOf(await pending), 1);
  assert.equal(seqOf(await stream.next()), 2);

  const next = stream.next();
  addMessage(game.id, 'white', 'hi');
  pubsub.publish(gameTopic(game.id), {});
  assert.equal(seqOf(await next), 3);
  await stream.return?.();
});

test('does not miss an event recorded while delivering earlier ones', async () => {
  const pubsub = new PubSub();
  const game = createGame('black');
  const stream = streamGameEvents(pubsub, game, -1);

  assert.equal(seqOf(await stream.next()), 0);
  // Nobody is listening for this notification yet, but the log still has it.
  addMessage(game.id, 'black', 'hi');
  pubsub.publish(gameTopic(game.id), {});
  assert.equal(seqOf(await stream.next()), 1);
  await stream.return?.();
});

test('return ends a stream that is waiting for events', async () => {
  const game = createGame('black');
  const stream = streamGameEvents(new PubSub(), game, 0);
  const pending = stream.next();
  // Let the stream settle into waiting, as it has by the time a client unsubscribes.
  await new Promise((resolve) => setImmediate(resolve));
  await stream.return?.();
  assert.equal((await pending).done, true);
});
