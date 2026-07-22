import Cell from './Cell.jsx';

export default function Board({ game, onPlay }) {
  if (!game) return null;

  const legal = new Set(game.legalMoves.map((m) => `${m.row},${m.col}`));

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
