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

  type AuthPayload {
    token: String!
    player: Player!
  }

  type Query {
    game(id: ID!): Game
  }

  type Mutation {
    newGame: Game!
    makeMove(gameId: ID!, row: Int!, col: Int!): Game!
    passMove(gameId: ID!): Game!
    registerPlayer(name: String!): AuthPayload!
    sayHello(gameId: ID!, message: String!): Boolean!
    joinAsOpponent(gameId: ID!): Boolean!
  }
  
  type Subscription {
    joinGame(gameId: ID!): SubscriptionMessage!
  }

  type SubscriptionMessage {
    message: String
    game: Game
  }
`;
