import { GraphQLError } from 'graphql';
import { PubSub } from 'graphql-subscriptions/dist/pubsub.js';
import { legalMoves, scores } from './game/reversi.js';
import type { Game } from './game/reversi.js';
import type { Player } from './gameStore.js';
import * as store from './gameStore.js';
import { createSession } from './sessionStore.js';

export type Context = {
  pubsub: PubSub;
  // Resolved from the session token; null when the request is unauthenticated.
  userId: string | null;
};

function requireUser({ userId }: Context): string {
  if (!userId) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return userId;
}

export const resolvers = {
  Query: {
    game: (_parent: unknown, { id }: { id: string }) => store.getGame(id)
  },

  Mutation: {

    registerPlayer: (
      _parent: unknown,
      { name }: { name: string }
    ): { token: string; player: Player } => {
      const player = store.registerPlayer(name);
      return { token: createSession(player.id), player };
    },

    newGame: (
      _parent: unknown,
      _args: unknown,
      context: Context
    ) : Game => {
      const game = store.createGame(requireUser(context));
      context.pubsub.publish(`JOIN_GAME_${game.id}`, { joinGame: { game } });
      return game;
    },

    makeMove: (
      _parent: unknown,
      { gameId, row, col }: { gameId: string; row: number; col: number },
      context: Context
    ): Game => {
      const game = store.makeMove(gameId, requireUser(context), row, col);
      context.pubsub.publish(`JOIN_GAME_${gameId}`, { joinGame: { game } });
      return game;
    },

    passMove: (
      _parent: unknown,
      { gameId }: { gameId: string },
      context: Context
    ): Game => {
      const game = store.passMove(gameId, requireUser(context));
      context.pubsub.publish(`JOIN_GAME_${gameId}`, { joinGame: { game } });
      return game;
    },

    sayHello: (
      _parent: unknown,
      { gameId, message }: { gameId: string; message: string },
      context: Context
    ): boolean => {
      requireUser(context);
      context.pubsub.publish(`JOIN_GAME_${gameId}`, { joinGame: { game: store.getGame(gameId), message } });
      return true;
    },

    joinAsOpponent: (
      _parent: unknown,
      { gameId }: { gameId: string },
      context: Context
    ): boolean => {
      store.joinGame(gameId, requireUser(context));
      context.pubsub.publish(`JOIN_GAME_${gameId}`, { joinGame: { game: store.getGame(gameId) } });
      return true;
    }

  },

  Subscription: {
    joinGame: {
      subscribe: (_parent: unknown, { gameId }: { gameId: string }, context: Context): any => {
        requireUser(context);
        const game = store.getGame(gameId);
        if (!game) {
          throw new Error(`Game with ID ${gameId} not found`);
        }
        console.log(context.pubsub);
        return context.pubsub.asyncIterableIterator(`JOIN_GAME_${gameId}`);
      }
    }
  },

  Game: {
    playerToTakeNextMove: (game: Game) => game.playerToTakeNextMove,
    blackPlayer: (game: Game) => game.blackPlayer,
    whitePlayer: (game: Game) => game.whitePlayer,
    legalMoves: (game: Game) => legalMoves(game.board, game.playerToTakeNextMove),
    scores: (game: Game) => scores(game.board),
    status: (game: Game) => (game.status),
    winner: (game: Game) => (game.status === 'FINISHED' ? game.winner : null),
    events: (game: Game) => game.events
  }
};
