import type { Disc } from '../graphql';
import DiscPiece from './DiscPiece';

type CellProps = {
  disc: Disc;
  playable: boolean;
  onPlay: () => void;
};

export default function Cell({ disc, playable, onPlay }: CellProps) {
  const hasDisc = disc === 'BLACK' || disc === 'WHITE';

  return (
    <button
      type="button"
      className="flex aspect-square items-center justify-center bg-board p-0 enabled:cursor-pointer"
      role="gridcell"
      disabled={!playable}
      onClick={onPlay}
      aria-label={hasDisc ? disc.toLowerCase() : playable ? 'playable' : 'empty'}
    >
      {hasDisc && <DiscPiece color={disc} />}
      {!hasDisc && playable && <span className="size-[28%] rounded-full bg-white/35" />}
    </button>
  );
}
