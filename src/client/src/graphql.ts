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
  mutation NewGame($userId: ID!) {
    newGame(userId: $userId) {
      id
    }
  }
`;

export const REGISTER_PLAYER = gql`
  mutation RegisterPlayer($name: String!) {
    registerPlayer(name: $name) {
      id
      name
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
  subscription JoinGame($gameId: ID!, $playerId: ID!) {
    joinGame(gameId: $gameId, playerId: $playerId) {
      ...GameFields
    } 
  }
  ${GAME_FIELDS}
`;

