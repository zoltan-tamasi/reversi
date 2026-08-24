import { legalMoves, scores } from './game/reversi.js';
import type { Game } from './game/reversi.js';
import * as store from './gameStore.js';

export const resolvers = {
  Query: {
    game: (_parent: unknown, { id }: { id: string }) => store.getGame(id)
  },

  Mutation: {
    newGame: () => store.createGame(),
    registerPlayer: (
      _parent: unknown,
      { name }: { name: string }
    ) => store.registerPlayer(name),
    makeMove: (
      _parent: unknown,
      { gameId, row, col }: { gameId: string; row: number; col: number }
    ) => store.makeMove(gameId, row, col),
    passMove: (_parent: unknown, { gameId }: { gameId: string }) =>
      store.passMove(gameId)
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
