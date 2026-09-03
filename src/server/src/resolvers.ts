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
    ): Player => store.registerPlayer(name),
    newGame: (_parent: unknown, { userId }: { userId: string }) => store.createGame(userId),
    makeMove: (
      _parent: unknown,
      { gameId, row, col }: { gameId: string; row: number; col: number }
    ) => store.makeMove(gameId, row, col),
    
    passMove: (_parent: unknown, { gameId }: { gameId: string }) =>
      store.passMove(gameId),

    joinGame: (_parent: unknown, { gameId, playerId }: { gameId: string; playerId: string }) => {
      const game = store.getGame(gameId);
      if (!game) {
        throw new Error(`Game with ID ${gameId} not found`);
      }
      game.whitePlayer = playerId;
      game.status = 'IN_PROGRESS';
      return game;
    }
  },

  Subscription: {
    joinGame: {
      subscribe: (_parent: unknown, { gameId }: { gameId: string }, { pubsub }: { pubsub: any }) => {
        const game = store.getGame(gameId);
        if (!game) {
          throw new Error(`Game with ID ${gameId} not found`);
        }
        return pubsub.asyncIterator(`JOIN_GAME_${gameId}`);
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
