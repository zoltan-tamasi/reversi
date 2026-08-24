// Core reversi/othello game engine. Pure functions — no state is stored here.

export const EMPTY = 'EMPTY' as const;
export const BLACK = 'BLACK' as const;
export const WHITE = 'WHITE' as const;

export type CellContent = typeof EMPTY | typeof BLACK | typeof WHITE;
export type Player = typeof BLACK | typeof WHITE;

export type Position = { row: number; col: number };
export type PositionWithFlips = { row: number; col: number; flips: Position[] };

const SIZE = 8 as const;

export type Board = Array<Array<CellContent>>;

export type Game = {
  id: string;
  status: 'WAITING_FOR_PLAYERS' | 'IN_PROGRESS' | 'FINISHED';
  board: Board;
  blackPlayer: string;  // user ID of the player controlling black
  whitePlayer: string;  // user ID of the player controlling white
  playerToTakeNextMove: Player;
  winner?: Player;
};

export type User = {
  id: string;
  name: string;
}

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1]
];

export const createNewGame = (): Game => {
  return {
    id: crypto.randomUUID(),
    status: 'WAITING_FOR_PLAYERS',
    board: createBoard(),
    blackPlayer: '',
    whitePlayer: '',
    playerToTakeNextMove: BLACK
  };
}

export const createBoard = (): Board => {
  const board = Array.from({ length: 8 }, () => Array<CellContent>(8).fill(EMPTY as CellContent));
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;
  return board;
}

export const opponent = (player: Player): Player => {
  return player === BLACK ? WHITE : BLACK;
};

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function legalMoves2(board: Board, player: Player): PositionWithFlips[] {
  const moves: PositionWithFlips[] = [];

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] !== EMPTY) {
        continue;
      }
      for (const [dr, dc] of DIRECTIONS) {
        const lineOfOpponentDiscs: Position[] = [];
        let r = row + dr;
        let c = col + dc;
        while (inBounds(r, c) && board[r][c] === opponent(player)) {
          lineOfOpponentDiscs.push({ row: r, col: c });
          r += dr;
          c += dc;
        }
        // The line is only valid if it is bookended by one of the player's discs.
        if (lineOfOpponentDiscs.length > 0 && inBounds(r, c) && board[r][c] === player) {
          moves.push({ row, col, flips: lineOfOpponentDiscs });
        }
      }
    }
  }
  return moves;

}

// Return the list of opponent discs that would be flipped if `player` plays
// at (row, col). An empty list means the move is illegal.
export function flipsForMove(board: Board, row: number, col: number, player: Player): Position[] {
  if (!inBounds(row, col) || board[row][col] !== EMPTY) {
    return [];
  }
  const flips: Position[] = [];

  for (const [dr, dc] of DIRECTIONS) {
    const line: Position[] = [];
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c) && board[r][c] === opponent(player)) {
      line.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
    // The line is only valid if it is bookended by one of the player's discs.
    if (line.length > 0 && inBounds(r, c) && board[r][c] === player) {
      flips.push(...line);
    }
  }

  return flips;
}

export function legalMoves(board: Board, player: Player) {
  const moves = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (flipsForMove(board, row, col, player).length > 0) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
}

// Apply a move, returning a new board. Throws if the move is illegal.
export function applyMove(board: Board, row: number, col: number, player: Player) {
  const flips = flipsForMove(board, row, col, player);
  if (flips.length === 0) {
    throw new Error(`Illegal move at (${row}, ${col}) for ${player}`);
  }
  const next = board.map((line: CellContent[]) => line.slice());
  next[row][col] = player;
  for (const { row: r, col: c } of flips) {
    next[r][c] = player;
  }
  return next;
}

export function scores(board: Board) {
  let black = 0;
  let white = 0;
  for (const line of board) {
    for (const cell of line) {
      if (cell === BLACK) black++;
      else if (cell === WHITE) white++;
    }
  }
  return { black, white };
}

export function winner(board: Board): Player | typeof EMPTY {
  const { black, white } = scores(board);
  if (black > white) return BLACK;
  if (white > black) return WHITE;
  return EMPTY; // a draw
}
