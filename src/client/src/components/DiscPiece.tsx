import type { Disc } from '../graphql';

type DiscPieceProps = {
  color: Exclude<Disc, 'EMPTY'>;
  className?: string;
};

export default function DiscPiece({ color, className = 'size-[78%]' }: DiscPieceProps) {
  const fill = color === 'BLACK' ? 'bg-[#111]' : 'bg-[#f5f5f5]';

  return (
    <span className={`inline-block rounded-full shadow-[inset_0_-2px_3px_rgba(0,0,0,0.35)] ${fill} ${className}`} />
  );
}
