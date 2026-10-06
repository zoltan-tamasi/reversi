export const typeDefs = `#graphql

  enum Disc {
    EMPTY
    BLACK
    WHITE
  }

  enum GameStatus {
    WAITING_FOR_PLAYERS
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
    playerToTakeNextMove: Disc!
    blackPlayer: String!
    whitePlayer: String!
    legalMoves: [Move!]!
    scores: Score!
    status: GameStatus!
    winner: Disc
  }

  type Player {
    id: ID!
    name: String! 
  }

  type Query {
    game(id: ID!): Game
  }

  type Mutation {
    newGame(userId: ID!): Game!
    makeMove(gameId: ID!, row: Int!, col: Int!): Game!
    passMove(gameId: ID!): Game!
    registerPlayer(name: String!): Player!
  }
  
  type Subscription {
    joinGame(gameId: ID!, playerId: ID!): Game!
  }
`;
