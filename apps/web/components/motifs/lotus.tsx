import type { ReactNode } from "react";

import { type ArtProps, type MotifKind, LEAF, BLOOM, HEART } from "./art";

const PETAL = "M0 0C3.2 -4 3.2 -10.5 0 -15C-3.2 -10.5 -3.2 -4 0 0Z";

function Bloom() {
  return (
    <>
      <g transform="translate(24 34)">
        <g fill={BLOOM} opacity="0.55">
          <path d={PETAL} transform="rotate(-74) scale(0.75)" />
          <path d={PETAL} transform="rotate(74) scale(0.75)" />
        </g>
        <g fill={BLOOM} opacity="0.8">
          <path d={PETAL} transform="rotate(-38) scale(0.9)" />
          <path d={PETAL} transform="rotate(38) scale(0.9)" />
        </g>
        <path d={PETAL} fill={BLOOM} />
        <ellipse cy="-4" rx="4" ry="2" fill={HEART} />
      </g>
      <path d="M8 38Q24 43 40 38" fill="none" stroke={LEAF} strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

/** A closed bud on a curved stem, with its two outer petals opening. */
function Bud() {
  return (
    <>
      <path
        d="M24 30C24 36 22 41 18 47"
        fill="none"
        stroke={LEAF}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M24 30C17 28 14 20 15.5 13C18.5 19 21.5 25 24 30Z" fill={BLOOM} opacity="0.6" />
      <path d="M24 30C31 28 34 20 32.5 13C29.5 19 26.5 25 24 30Z" fill={BLOOM} opacity="0.6" />
      <path d="M24 4C31 12 31 24 24 30C17 24 17 12 24 4Z" fill={BLOOM} />
    </>
  );
}

/** A lily pad from above, with its notch and veins. */
function Pad() {
  return (
    <>
      <path d="M24 24L42 14.9A20 20 0 1 0 43.9 26.1Z" fill={LEAF} />
      <g stroke="var(--md-sys-color-surface)" strokeWidth="1" opacity="0.5">
        <path d="M24 24L24 4.5M24 24L7 14M24 24L6 32M24 24L18 43M24 24L36 40" />
      </g>
    </>
  );
}

/** A seed pod from above: the flat head with its seeds. */
function Pod() {
  const seeds: (readonly [number, number])[] = [
    [24, 24],
    [24, 15],
    [32, 20],
    [31, 29],
    [24, 33],
    [16, 29],
    [16, 20],
  ];
  return (
    <>
      <circle cx="24" cy="24" r="16" fill={HEART} opacity="0.8" />
      <circle cx="24" cy="24" r="16" fill="none" stroke={LEAF} strokeWidth="2" />
      <g fill={LEAF}>
        {seeds.map(([x, y]) => (
          <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r="2.6" />
        ))}
      </g>
    </>
  );
}

/** A bud rising from a lily pad seen at an angle. */
function BudOnPad() {
  return (
    <>
      <path d="M24 40L36 37A18 6 0 1 1 35 43Z" fill={LEAF} />
      <path d="M26 39C26 33 27 29 28 24" fill="none" stroke={LEAF} strokeWidth="2" />
      <path d="M28 24C23 21 22 14 24 9C26 13 27 18 28 24Z" fill={BLOOM} opacity="0.6" />
      <path d="M28 24C33 21 34 14 32 9C30 13 29 18 28 24Z" fill={BLOOM} opacity="0.6" />
      <path d="M28 2C33 8 33 18 28 24C23 18 23 8 28 2Z" fill={BLOOM} />
    </>
  );
}

/** Two fallen petals drifting on the water. */
function Petals() {
  return (
    <>
      <path d={PETAL} fill={BLOOM} transform="translate(16 30) rotate(-60)" />
      <path
        d={PETAL}
        fill={BLOOM}
        opacity="0.6"
        transform="translate(30 20) rotate(25) scale(0.8)"
      />
      <path
        d="M6 40Q16 37 26 40M22 45Q32 42 42 45"
        fill="none"
        stroke={LEAF}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  );
}

/** Card drawings: bloom, bud, lily pad, seed pod, bud on a pad, fallen petals. */
export const LOTUS_MOTIFS: Record<MotifKind, () => ReactNode> = {
  bloom: Bloom,
  bud: Bud,
  leaf: Pad,
  heart: Pod,
  budOnLeaf: BudOnPad,
  petals: Petals,
};

const MARK_PETAL = "M0 0C2.6 -3.2 2.6 -8.4 0 -12C-2.6 -8.4 -2.6 -3.2 0 0Z";

/** The lotus mark, 24 units square; the favicon (`app/icon.svg`) is a static copy. */
export function LotusMark({ size, className }: ArtProps & { size: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
    >
      <g transform="translate(12 17)">
        <g fill={BLOOM} opacity="0.55">
          <path d={MARK_PETAL} transform="rotate(-72) scale(0.72)" />
          <path d={MARK_PETAL} transform="rotate(72) scale(0.72)" />
        </g>
        <g fill={BLOOM} opacity="0.8">
          <path d={MARK_PETAL} transform="rotate(-36) scale(0.88)" />
          <path d={MARK_PETAL} transform="rotate(36) scale(0.88)" />
        </g>
        <path d={MARK_PETAL} fill={BLOOM} />
      </g>
      <path
        d="M4 19.5Q12 22.5 20 19.5"
        fill="none"
        stroke={LEAF}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A petal pointing up from the origin, `length` tall and `width` wide. */
function petal(length: number, width: number): string {
  const l = length;
  const w = width / 2;
  return (
    `M0 0C${String(w * 1.6)} ${String(-l * 0.3)} ${String(w)} ${String(-l * 0.8)} 0 ${String(-l)}` +
    `C${String(-w)} ${String(-l * 0.8)} ${String(-w * 1.6)} ${String(-l * 0.3)} 0 0Z`
  );
}

const BACK = { path: petal(170, 70), angles: [-68, -34, 0, 34, 68] };
const SIDE = { path: petal(130, 60), angles: [-92, 92] };
const FRONT = { path: petal(128, 64), angles: [-48, -16, 16, 48] };

/** A lily pad: a disc with a wedge cut out, seen at an angle. */
const PAD = "M0 0L58 -14A100 34 0 1 1 52 16Z";

/** The lotus behind the content: a bloom on its stem over lily pads and rippled water. */
export function LotusBackdrop({ className }: ArtProps) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 440 440" className={className}>
      <g fill="none" stroke={LEAF} strokeWidth="2" opacity="0.7">
        <ellipse cx="230" cy="402" rx="190" ry="22" />
        <ellipse cx="230" cy="402" rx="130" ry="13" />
      </g>
      <path
        d="M224 262C214 312 236 352 230 404"
        fill="none"
        stroke={LEAF}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <g fill={LEAF}>
        <path d={PAD} transform="translate(110 392) rotate(-6)" />
        <path d={PAD} transform="translate(352 396) scale(-0.72 0.72) rotate(-4)" />
      </g>
      <g transform="translate(224 262)">
        <g fill={BLOOM} opacity="0.55">
          {[...SIDE.angles, ...BACK.angles].map((angle, i) => (
            <path
              key={angle}
              d={i < SIDE.angles.length ? SIDE.path : BACK.path}
              transform={`rotate(${String(angle)})`}
            />
          ))}
        </g>
        <g fill={BLOOM}>
          {FRONT.angles.map((angle) => (
            <path key={angle} d={FRONT.path} transform={`rotate(${String(angle)})`} />
          ))}
        </g>
        <ellipse cx="0" cy="-30" rx="26" ry="14" fill={HEART} />
      </g>
    </svg>
  );
}
