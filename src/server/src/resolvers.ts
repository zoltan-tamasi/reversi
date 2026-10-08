import { PubSub } from 'graphql-subscriptions/dist/pubsub.js';
import { legalMoves, scores } from './game/reversi.js';
import type { Game } from './game/reversi.js';
import type { Player } from './gameStore.js';
import * as store from './gameStore.js';

export const resolvers = {
  Query: {
    game: (_parent: unknown, { id }: { id: string }) => store.getGame(id)
  },

  Mutation: {

    registerPlayer: (
      _parent: unknown,
      { name }: { name: string }
    ): Player => 
      store.registerPlayer(name),

    newGame: (_parent: unknown, { userId }: { userId: string }) : Game => 
      store.createGame(userId),

    makeMove: (
      _parent: unknown,
      { gameId, row, col }: { gameId: string; row: number; col: number },
      { pubsub }: { pubsub: PubSub }
    ): Game => {
      pubsub.publish(`JOIN_GAME_${gameId}`, { joinGame: store.getGame(gameId) });
      return store.makeMove(gameId, row, col);
    },
    
    passMove: (_parent: unknown, { gameId }: { gameId: string }, { pubsub }: { pubsub: PubSub }): Game => 
      store.passMove(gameId)

  },

  Subscription: {
    joinGame: {
      subscribe: (_parent: unknown, { gameId, playerId }: { gameId: string; playerId: string }, { pubsub }: { pubsub: PubSub }): any => {
        const game = store.getGame(gameId);
        if (!game) {
          throw new Error(`Game with ID ${gameId} not found`);
        }
        console.log(pubsub);
        return pubsub.asyncIterableIterator(`JOIN_GAME_${gameId}`);
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
    winner: (game: Game) => (game.status === 'FINISHED' ? game.winner : null)
  }
};
