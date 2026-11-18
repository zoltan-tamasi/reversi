import { gql } from '@apollo/client';
import type { GameEvent } from '@reversi/shared';

export type { GameEvent };

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

export type ChatMessage = {
  sender: string | null;
  text: string;
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

// Shared fragment so the query and the subscription return the same event shape.
export const GAME_EVENT_FIELDS = gql`
  fragment GameEventFields on GameEvent {
    seq
    type
    player
    row
    col
    message
    senderName
    winner
    timestamp
    initiatedBy
  }
`;

export const GET_GAME = gql`
  query GetGame($id: ID!) {
    game(id: $id) {
      id
      events {
        ...GameEventFields
      }
    }
  }
  ${GAME_EVENT_FIELDS}
`;

export const NEW_GAME = gql`
  mutation NewGame {
    newGame {
      id
    }
  }
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
      error
    }
  }
`;

export const MAKE_MOVE = gql`
  mutation MakeMove($gameId: ID!, $row: Int!, $col: Int!) {
    makeMove(gameId: $gameId, row: $row, col: $col)
  }
`;

export const PASS_MOVE = gql`
  mutation PassMove($gameId: ID!) {
    passMove(gameId: $gameId)
  }
`;

export const JOIN_GAME = gql`
  subscription JoinGame($gameId: ID!, $afterSeq: Int!) {
    joinGame(gameId: $gameId, afterSeq: $afterSeq) {
      ...GameEventFields
    }
  }
  ${GAME_EVENT_FIELDS}
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

export const LEAVE_GAME = gql`
  mutation LeaveGame {
    leaveGame
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;
