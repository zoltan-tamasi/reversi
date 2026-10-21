import type { Disc, Game } from '../graphql';
import DiscPiece from './DiscPiece';

type GameInfoProps = {
  game: Game | null;
  myColor: Disc | null;
  onPass: () => void;
};

export default function GameInfo({ game, myColor, onPass }: GameInfoProps) {
  if (!game) return null;

  const { scores, playerToTakeNextMove, status, winner, legalMoves } = game;
  const finished = status === 'FINISHED';
  const canPass = !finished && legalMoves.length === 0;
  const side = myColor;

  return (
    <div className="mb-4 flex flex-col gap-2">
      {side ? (
        <p className="inline-flex items-center justify-center gap-1.5 font-semibold">
          {side !== 'EMPTY' && <DiscPiece color={side} className="size-[1.1rem]" />} You are playing {label(side)}
        </p>
      ) : (
        status !== 'WAITING_FOR_PLAYERS' && <p className="font-semibold">You are watching</p>
      )}

      <div className="flex justify-center gap-6 text-xl font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <DiscPiece color="BLACK" className="size-[1.1rem]" /> {scores.black}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <DiscPiece color="WHITE" className="size-[1.1rem]" /> {scores.white}
        </span>
      </div>

      {status === 'WAITING_FOR_PLAYERS' && <p>Waiting for players…</p>}
      <p className="text-lg">
        {finished
          ? winner === 'EMPTY'
            ? "It's a draw!"
            : winner
              ? `${label(winner)} wins!`
              : 'Game ended.'
          : `${label(playerToTakeNextMove)} to move`}
      </p>

      <div className="flex justify-center gap-2">
        {canPass && (
          <button type="button" onClick={onPass} className="btn btn-primary">
            Pass
          </button>
        )}
      </div>
    </div>
  );
}

function label(disc: Disc): string {
  return disc === 'BLACK' ? 'Black' : 'White';
}
