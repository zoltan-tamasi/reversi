import { gql } from '@apollo/client';

export type Disc = 'EMPTY' | 'BLACK' | 'WHITE';
export type GameStatus = 'WAITING_FOR_PLAYERS' | 'IN_PROGRESS' | 'FINISHED';

export type Move = {
  row: number;
  col: number;
};

export type Score = {
  black: number;
  white: number;
};

export type Game = {
  id: string;
  board: Disc[][];
  playerToTakeNextMove: Disc;
  blackPlayer: string;
  whitePlayer: string;
  legalMoves: Move[];
  scores: Score;
  status: GameStatus;
  winner: Disc | null;
};

export type Player = {
  id: string;
  name: string;
};

export type UserSession = {
  player: Player;
  currentGameId: string | null;
  color: Disc | null;
};

// Shared fragment so every query/mutation returns a consistent game shape.
export const GAME_FIELDS = gql`
  fragment GameFields on Game {
    id
    board
    playerToTakeNextMove
    blackPlayer
    whitePlayer
    legalMoves {
      row
      col
    }
    scores {
      black
      white
    }
    status
    winner
  }
`;

export const GET_GAME = gql`
  query GetGame($id: ID!) {
    game(id: $id) {
      ...GameFields
    }
  }
  ${GAME_FIELDS}
`;

export const NEW_GAME = gql`
  mutation NewGame {
    newGame {
      ...GameFields
    }
  }
  ${GAME_FIELDS}
`;

export const RESTORE_USER_SESSION = gql`
  query RestoreUserSession {
    restoreUserSession {
      player {
        id
        name
      }
      currentGameId
      color
    }
  }
`;

export const REGISTER_PLAYER = gql`
  mutation RegisterPlayer($name: String!) {
    registerPlayer(name: $name) {
      token
      player {
        id
        name
      }
    }
  }
`;

export const MAKE_MOVE = gql`
  mutation MakeMove($gameId: ID!, $row: Int!, $col: Int!) {
    makeMove(gameId: $gameId, row: $row, col: $col) {
      ...GameFields
    }
  }
  ${GAME_FIELDS}
`;

export const PASS_MOVE = gql`
  mutation PassMove($gameId: ID!) {
    passMove(gameId: $gameId) {
      ...GameFields
    }
  }
  ${GAME_FIELDS}
`;

export const JOIN_GAME = gql`
  subscription JoinGame($gameId: ID!) {
    joinGame(gameId: $gameId) {
      game {  
        ...GameFields
      }
      message
    } 
  }
  ${GAME_FIELDS}
`;

export const SAY_HELLO = gql`
  mutation SayHello($gameId: ID!, $message: String!) {
    sayHello(gameId: $gameId, message: $message)
  }
`;

export const JOIN_AS_OPPONENT = gql`
  mutation JoinAsOpponent($gameId: ID!) {
    joinAsOpponent(gameId: $gameId) 
  }
`;
