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
    # The event's position in Game.events.
    seq: Int!
    type: String!
    player: Disc
    row: Int
    col: Int
    message: String
    senderName: String
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

  # Returned by restoreUserSession: who the token belongs to and where they are.
  type UserSession {
    player: Player!
    currentGameId: ID
    # Null while not in a game or only watching one.
    color: Disc
  }

  type AuthPayload {
    token: String!
    player: Player!
    error: ErrorType
  }

  enum ErrorType {
    PLAYER_NAME_ALREADY_EXISTS
  }

  type Query {
    game(id: ID!): Game
    # The player owning the session token, or null if the token is missing or unknown.
    restoreUserSession: UserSession
  }

  type Mutation {
    newGame: Game!
    makeMove(gameId: ID!, row: Int!, col: Int!): Boolean!
    passMove(gameId: ID!): Boolean!
    registerPlayer(name: String!): AuthPayload!
    sayHello(gameId: ID!, message: String!): Boolean!
    joinAsOpponent(gameId: ID!): Boolean!
    leaveGame: Boolean!
    logout: Boolean!
  }
  
  type Subscription {
    # Streams the game's events with a seq above afterSeq: already recorded ones first, then new ones.
    joinGame(gameId: ID!, afterSeq: Int!): GameEvent!
  }
`;
