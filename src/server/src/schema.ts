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

  type GameEvent {
    type: String!
    player: Disc
    row: Int
    col: Int
    message: String
    winner: Disc
    timestamp: Float!
    initiatedBy: ID!
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
    events: [GameEvent!]!
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
    makeMove(gameId: ID!, userId: ID!, row: Int!, col: Int!): Game!
    passMove(gameId: ID!, userId: ID!): Game!
    registerPlayer(name: String!): Player!
    sayHello(gameId: ID!, userId: ID!, message: String!): Boolean!
    joinAsOpponent(gameId: ID!, userId: ID!): Boolean!
  }
  
  type Subscription {
    joinGame(gameId: ID!, playerId: ID!): SubscriptionMessage!
  }

  type SubscriptionMessage {
    message: String
    game: Game
  }
`;
