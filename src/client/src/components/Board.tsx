import type { Game } from '../graphql';
import Cell from './Cell';

type BoardProps = {
  game: Game | null;
  userId: string | null;
  onPlay: (row: number, col: number) => void;
};

export default function Board({ game, userId, onPlay }: BoardProps) {
  if (!game) return null;

  const playerToMove = game.playerToTakeNextMove === 'BLACK' ? game.blackPlayer : game.whitePlayer;
  const thisPlayersTurn = game.status === 'IN_PROGRESS' && userId === playerToMove;
  const legal = new Set(
    thisPlayersTurn ? game.legalMoves.map((move) => `${move.row},${move.col}`) : []
  );

  return (
    <div className="board" role="grid" aria-label="Reversi board">
      {game.board.map((line, row) =>
        line.map((disc, col) => (
          <Cell
            key={`${row},${col}`}
            disc={disc}
            playable={legal.has(`${row},${col}`)}
            onPlay={() => onPlay(row, col)}
          />
        ))
      )}
    </div>
  );
}
