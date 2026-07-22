import { gql } from '@apollo/client';

// Shared fragment so every query/mutation returns a consistent game shape.
export const GAME_FIELDS = gql`
  fragment GameFields on Game {
    id
    board
    currentPlayer
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
