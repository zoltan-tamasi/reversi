export default function Cell({ disc, playable, onPlay }) {
  const hasDisc = disc === 'BLACK' || disc === 'WHITE';

  return (
    <button
      type="button"
      className="cell"
      role="gridcell"
      disabled={!playable}
      onClick={onPlay}
      aria-label={hasDisc ? disc.toLowerCase() : playable ? 'playable' : 'empty'}
    >
      {hasDisc && <span className={`disc ${disc.toLowerCase()}`} />}
      {!hasDisc && playable && <span className="hint" />}
    </button>
  );
}
