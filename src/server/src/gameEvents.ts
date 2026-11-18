import type { PubSub } from 'graphql-subscriptions/dist/pubsub.js';
import type { Game, GameEvent } from '@reversi/shared';

export const gameTopic = (gameId: string): string => `JOIN_GAME_${gameId}`;

// Streams a game's events after `afterSeq`: first any already recorded, then
// new ones as they happen. The game's log is the source of truth and pubsub
// only signals that it grew, so a subscriber can't miss an event, even one
// recorded before it subscribed or while it was reconnecting.
export function streamGameEvents(
  pubsub: PubSub,
  game: Game,
  afterSeq: number
): AsyncIterableIterator<{ joinGame: GameEvent }> {
  const changes = pubsub.asyncIterableIterator(gameTopic(game.id));
  let nextSeq = Math.max(afterSeq + 1, 0);

  return {
    async next() {
      while (true) {
        const event = game.events[nextSeq];
        if (event) {
          nextSeq++;
          return { value: { joinGame: event }, done: false };
        }
        // The first changes.next() starts listening synchronously, so nothing
        // can be recorded between the check above and listening.
        const change = await changes.next();
        if (change.done) {
          return { value: undefined, done: true };
        }
      }
    },
    return() {
      return changes.return() as Promise<IteratorResult<{ joinGame: GameEvent }>>;
    },
    throw(error) {
      return changes.throw(error) as Promise<IteratorResult<{ joinGame: GameEvent }>>;
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
