import { GraphQLError } from 'graphql';
import { PubSub } from 'graphql-subscriptions/dist/pubsub.js';
import { legalMoves, scores } from '@reversi/shared';
import type { Game } from '@reversi/shared';
import { gameTopic, streamGameEvents } from './gameEvents.js';
import type { Player, PlayerSettings } from './gameStore.js';
import * as store from './gameStore.js';
import { createSession, deleteSession } from './sessionStore.js';

type UserSession = {
  player: Player;
  currentGameId: string | null;
  color: Player['color'];
};

export type ErrorType = 'PLAYER_NAME_ALREADY_EXISTS' | 'UNKNOWN_ERROR';

export type Context = {
  pubsub: PubSub;
  // The raw session token sent by the client, whether or not it is valid.
  token: string | null;
  // Resolved from the session token; null when the request is unauthenticated.
  userId: string | null;
};

function requireUser({ userId }: Context): string {
  if (!userId) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return userId;
}

// Wakes the game's subscribers so they stream whatever was just recorded.
function notifySubscribers({ pubsub }: Context, gameId: string): void {
  pubsub.publish(gameTopic(gameId), {});
}

export const resolvers = {
  Query: {
    game: (_parent: unknown, { id }: { id: string }) => store.getGame(id),
    restoreUserSession: (_parent: unknown, _args: unknown, { userId }: Context): UserSession | null => {
      const player = userId ? store.getPlayer(userId) : null;
      return player
        ? { player, currentGameId: player.currentGameId, color: player.color }
        : null;
    }
  },

  Mutation: {

    registerPlayer: (
      _parent: unknown,
      { name }: { name: string }
    ): { token: string; player: Player, error: ErrorType | null } => {
      const response = store.registerPlayer(name);
      if (response.success) {
        const player = response.data;
        return { token: createSession(player.id), player, error: null };
      }
      const error = response.error;
      const player = { id: '', name: '', currentGameId: null, color: null, settings: store.defaultSettings() };

      return { token: "", player, error: error };
    },

    newGame: (
      _parent: unknown,
      _args: unknown,
      context: Context
    ) : Game => store.createGame(requireUser(context)),

    makeMove: (
      _parent: unknown,
      { gameId, row, col }: { gameId: string; row: number; col: number },
      context: Context
    ): boolean => {
      store.makeMove(gameId, requireUser(context), row, col);
      notifySubscribers(context, gameId);
      return true;
    },

    passMove: (
      _parent: unknown,
      { gameId }: { gameId: string },
      context: Context
    ): boolean => {
      store.passMove(gameId, requireUser(context));
      notifySubscribers(context, gameId);
      return true;
    },

    sayHello: (
      _parent: unknown,
      { gameId, message }: { gameId: string; message: string },
      context: Context
    ): boolean => {
      store.addMessage(gameId, requireUser(context), message);
      notifySubscribers(context, gameId);
      return true;
    },

    joinAsOpponent: (
      _parent: unknown,
      { gameId }: { gameId: string },
      context: Context
    ): boolean => {
      store.joinGame(gameId, requireUser(context));
      notifySubscribers(context, gameId);
      return true;
    },

    leaveGame: (_parent: unknown, _args: unknown, context: Context): boolean => {
      store.leaveGame(requireUser(context));
      return true;
    },

    saveSettings: (
      _parent: unknown,
      { settings }: { settings: Partial<PlayerSettings> },
      context: Context
    ): Player => store.updateSettings(requireUser(context), settings),

    logout: (_parent: unknown, _args: unknown, context: Context): boolean => {
      if (context.token) {
        deleteSession(context.token);
      }
      return true;
    }

  },

  Subscription: {
    joinGame: {
      subscribe: (_parent: unknown, { gameId, afterSeq }: { gameId: string; afterSeq: number }, context: Context): any => {
        requireUser(context);
        const game = store.getGame(gameId);
        if (!game) {
          throw new Error(`Game with ID ${gameId} not found`);
        }
        console.log(context.pubsub);
        return streamGameEvents(context.pubsub, game, afterSeq);
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
