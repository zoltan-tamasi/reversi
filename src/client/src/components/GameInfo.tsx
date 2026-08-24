import type { Disc, Game } from '../graphql';

type GameInfoProps = {
  game: Game | null;
  onNewGame: () => void;
  onPass: () => void;
};

export default function GameInfo({ game, onNewGame, onPass }: GameInfoProps) {
  if (!game) return null;

  const { scores, playerToTakeNextMove, status, winner, legalMoves } = game;
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

      {status === 'WAITING_FOR_PLAYERS' && <p>Waiting for players…</p>}
      <p className="status">
        {finished
          ? winner === 'EMPTY'
            ? "It's a draw!"
            : winner
              ? `${label(winner)} wins!`
              : 'Game ended.'
          : `${label(playerToTakeNextMove)} to move`}
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

function label(disc: Disc): string {
  return disc === 'BLACK' ? 'Black' : 'White';
}
