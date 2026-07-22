import { isFinished, legalMoves, scores, winner } from './game/reversi.js';
import * as store from './gameStore.js';
import type { Game } from './gameStore.js';

export const resolvers = {
  Query: {
    game: (_parent: unknown, { id }: { id: string }) => store.getGame(id)
  },

  Mutation: {
    newGame: () => store.createGame(),
    makeMove: (
      _parent: unknown,
      { gameId, row, col }: { gameId: string; row: number; col: number }
    ) => store.makeMove(gameId, row, col),
    passMove: (_parent: unknown, { gameId }: { gameId: string }) =>
      store.passMove(gameId)
  },

  Game: {
    legalMoves: (game: Game) => legalMoves(game.board, game.currentPlayer),
    scores: (game: Game) => scores(game.board),
    status: (game: Game) => (isFinished(game.board) ? 'FINISHED' : 'IN_PROGRESS'),
    winner: (game: Game) => (isFinished(game.board) ? winner(game.board) : null)
  }
};
