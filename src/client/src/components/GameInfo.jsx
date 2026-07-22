export default function GameInfo({ game, onNewGame, onPass }) {
  if (!game) return null;

  const { scores, currentPlayer, status, winner, legalMoves } = game;
  const finished = status === 'FINISHED';
  const canPass = !finished && legalMoves.length === 0;

  return (
    <div className="info">
      <div className="scores">
        <span className="score">
          <span className="disc black" /> {scores.black}
        </span>
        <span className="score">
          <span className="disc white" /> {scores.white}
        </span>
      </div>

      <p className="status">
        {finished
          ? winner === 'EMPTY'
            ? "It's a draw!"
            : `${label(winner)} wins!`
          : `${label(currentPlayer)} to move`}
      </p>

      <div className="actions">
        {canPass && (
          <button type="button" onClick={onPass}>
            Pass
          </button>
        )}
        <button type="button" onClick={onNewGame}>
          New game
        </button>
      </div>
    </div>
  );
}

function label(disc) {
  return disc === 'BLACK' ? 'Black' : 'White';
}
