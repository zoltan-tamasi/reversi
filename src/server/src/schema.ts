export const typeDefs = `#graphql

  enum Disc {
    EMPTY
    BLACK
    WHITE
  }

  enum GameStatus {
    IN_PROGRESS
    FINISHED
  }

  type Move {
    row: Int!
    col: Int!
  }

  type Score {
    black: Int!
    white: Int!
  }

  type Game {
    id: ID!
    board: [[Disc!]!]!
    currentPlayer: Disc!
    legalMoves: [Move!]!
    scores: Score!
    status: GameStatus!
    winner: Disc
  }

  type Query {
    game(id: ID!): Game
  }

  type Mutation {
    newGame: Game!
    makeMove(gameId: ID!, row: Int!, col: Int!): Game!
    passMove(gameId: ID!): Game!
  }
`;
