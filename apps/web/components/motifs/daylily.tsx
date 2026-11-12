import type { ReactNode } from "react";

import { type ArtProps, BLOOM, type MotifKind, HEART, LEAF } from "./art";

/**
 * Daylily (huyên thảo) drawings: a six-petalled star with a yellow throat and long
 * stamens, slender buds, and long arching leaves.
 */

const n = (value: number) => String(Math.round(value * 100) / 100);

/** A lance-shaped petal pointing up from the origin, `length` long and `width` wide. */
function petal(length: number, width: number): string {
  const l = length;
  const w = width / 2;
  return (
    `M0 0C${n(w * 1.1)} ${n(-l * 0.25)} ${n(w)} ${n(-l * 0.7)} 0 ${n(-l)}` +
    `C${n(-w)} ${n(-l * 0.7)} ${n(-w * 1.1)} ${n(-l * 0.25)} 0 0Z`
  );
}

/** A slender closed bud pointing up from the origin. */
function bud(length: number, width: number): string {
  const l = length;
  const w = width / 2;
  return `M0 0C${n(w)} ${n(-l * 0.2)} ${n(w * 1.1)} ${n(-l * 0.65)} 0 ${n(-l)}C${n(-w * 1.1)} ${n(-l * 0.65)} ${n(-w)} ${n(-l * 0.2)} 0 0Z`;
}

/** An open flower seen from the front, centred on the origin. */
function Star({
  length,
  width,
  stamens = true,
}: {
  length: number;
  width: number;
  stamens?: boolean;
}) {
  const back = petal(length * 0.95, width * 1.1);
  const front = petal(length, width);
  const throat = length * 0.24;
  return (
    <g>
      <g fill={BLOOM} opacity="0.6">
        {[30, 150, 270].map((a) => (
          <path key={a} d={back} transform={`rotate(${String(a)})`} />
        ))}
      </g>
      <g fill={BLOOM}>
        {[90, 210, 330].map((a) => (
          <path key={a} d={front} transform={`rotate(${String(a)})`} />
        ))}
      </g>
      {/* The pale stripe down the middle of each front petal. */}
      <g stroke={HEART} strokeWidth={length * 0.04} strokeLinecap="round" opacity="0.7">
        {[90, 210, 330].map((a) => (
          <path
            key={a}
            d={`M0 ${n(-throat)}L0 ${n(-length * 0.7)}`}
            transform={`rotate(${String(a)})`}
          />
        ))}
      </g>
      <circle r={throat} fill={HEART} />
      {stamens && (
        <g
          fill="none"
          stroke={HEART}
          strokeWidth={length * 0.035}
          strokeLinecap="round"
          transform="rotate(-20)"
        >
          {[-14, 0, 14].map((a) => (
            <g key={a} transform={`rotate(${String(a)})`}>
              <path d={`M0 0Q${n(length * 0.12)} ${n(-length * 0.4)} 0 ${n(-length * 0.62)}`} />
              <circle cy={-length * 0.62} r={length * 0.04} fill={HEART} />
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

/** Long leaves arching out from one point. */
function Leaves({ blades }: { blades: readonly string[] }) {
  return (
    <g fill={LEAF}>
      {blades.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

const CARD_LEAVES = [
  "M22 48C20 34 12 22 2 16C14 24 21 34 26 48Z",
  "M23 48C24 32 28 18 36 6C30 20 27 32 27 48Z",
  "M25 48C30 38 38 32 47 30C38 35 31 40 28 48Z",
];

/** Card drawings: open flower, buds, leaves, the throat close up, buds over leaves, petals. */
export const DAYLILY_MOTIFS: Record<MotifKind, () => ReactNode> = {
  bloom: () => (
    <>
      <path d="M24 26C25 34 23 41 20 48" fill="none" stroke={LEAF} strokeWidth="2" />
      <g transform="translate(24 22)">
        <Star length={18} width={8} />
      </g>
    </>
  ),
  bud: () => (
    <>
      <path d="M20 48C22 38 24 30 25 22" fill="none" stroke={LEAF} strokeWidth="2" />
      <path d={bud(22, 7)} fill={BLOOM} transform="translate(25 23) rotate(8)" />
      <path d={bud(14, 5)} fill={BLOOM} opacity="0.6" transform="translate(24 27) rotate(-38)" />
    </>
  ),
  leaf: () => <Leaves blades={CARD_LEAVES} />,
  heart: () => (
    <g transform="translate(24 24)">
      <Star length={24} width={11} />
    </g>
  ),
  budOnLeaf: () => (
    <>
      <Leaves blades={CARD_LEAVES} />
      <path d="M25 48C26 34 27 22 29 12" fill="none" stroke={LEAF} strokeWidth="2" />
      <path d={bud(14, 5)} fill={BLOOM} transform="translate(29 13) rotate(-14)" />
      <path d={bud(11, 4)} fill={BLOOM} opacity="0.6" transform="translate(29 14) rotate(30)" />
    </>
  ),
  petals: () => (
    <>
      <path d={petal(18, 7)} fill={BLOOM} transform="translate(14 32) rotate(-62)" />
      <path d={petal(15, 6)} fill={BLOOM} opacity="0.6" transform="translate(30 22) rotate(28)" />
      <path
        d="M6 40Q16 37 26 40M22 45Q32 42 42 45"
        fill="none"
        stroke={LEAF}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  ),
};

/** The daylily mark, 24 units square. */
export function DaylilyMark({ size, className }: ArtProps & { size: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
    >
      <g fill="none" stroke={LEAF} strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 23C10 20 7 18.5 3 18.2" />
        <path d="M12 23C14 20.5 17 19.2 21 19.2" />
      </g>
      <g transform="translate(12 11)">
        <Star length={9.5} width={4.4} stamens={false} />
      </g>
    </svg>
  );
}

const BACKDROP_LEAVES = [
  "M226 440C200 380 150 330 40 300C150 345 205 390 238 440Z",
  "M228 440C214 360 190 300 120 220C200 300 228 360 240 440Z",
  "M232 440C246 370 280 320 380 280C290 330 254 380 244 440Z",
  "M234 440C250 390 300 360 430 360C310 375 262 400 246 440Z",
  "M230 440C232 380 240 330 262 280C250 335 244 385 242 440Z",
];

/** The daylily behind the content: two flowers and two buds on tall stems over a clump of leaves. */
export function DaylilyBackdrop({ className }: ArtProps) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 440 440" className={className}>
      <g fill="none" stroke={LEAF} strokeWidth="6" strokeLinecap="round">
        <path d="M236 430C240 330 250 250 262 176" />
        <path d="M236 430C226 350 200 290 156 250" />
        <path d="M238 430C260 330 300 220 330 120" />
      </g>
      <Leaves blades={BACKDROP_LEAVES} />
      <path d={bud(70, 22)} fill={BLOOM} transform="translate(330 122) rotate(12)" />
      <path d={bud(50, 16)} fill={BLOOM} opacity="0.6" transform="translate(326 136) rotate(-30)" />
      <g transform="translate(262 168) rotate(-8)">
        <Star length={100} width={46} />
      </g>
      <g transform="translate(150 242) rotate(18)">
        <Star length={58} width={27} />
      </g>
    </svg>
  );
}
