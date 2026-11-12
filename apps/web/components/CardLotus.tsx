import type { ReactNode } from "react";

/**
 * Faint lotus drawings for the corners of cards. Each card gets its own motif and
 * place, so a screen of cards reads like a pond rather than a stamp repeated. They
 * sit between the card's background and its content (the card is
 * `relative isolate overflow-hidden`), use the scheme's color roles and are hidden
 * from assistive technology.
 */
export type LotusMotif = "bloom" | "bud" | "pad" | "pod" | "budOnPad" | "petals";
export type LotusPlace = "bottomRight" | "topRight" | "right";

export interface CardLotusProps {
  readonly motif: LotusMotif;
  readonly place: LotusPlace;
  /** Tilt in degrees, so the same motif does not always stand upright. */
  readonly tilt?: number;
}

const PETAL = "M0 0C3.2 -4 3.2 -10.5 0 -15C-3.2 -10.5 -3.2 -4 0 0Z";
const PINK = "var(--md-sys-color-primary)";
const GREEN = "var(--md-sys-color-tertiary)";
const YELLOW = "var(--md-sys-color-warning)";

function Bloom() {
  return (
    <>
      <g transform="translate(24 34)">
        <g fill={PINK} opacity="0.55">
          <path d={PETAL} transform="rotate(-74) scale(0.75)" />
          <path d={PETAL} transform="rotate(74) scale(0.75)" />
        </g>
        <g fill={PINK} opacity="0.8">
          <path d={PETAL} transform="rotate(-38) scale(0.9)" />
          <path d={PETAL} transform="rotate(38) scale(0.9)" />
        </g>
        <path d={PETAL} fill={PINK} />
        <ellipse cy="-4" rx="4" ry="2" fill={YELLOW} />
      </g>
      <path
        d="M8 38Q24 43 40 38"
        fill="none"
        stroke={GREEN}
        strokeWidth="2"
        strokeLinecap="round"
      />
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
        stroke={GREEN}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M24 30C17 28 14 20 15.5 13C18.5 19 21.5 25 24 30Z" fill={PINK} opacity="0.6" />
      <path d="M24 30C31 28 34 20 32.5 13C29.5 19 26.5 25 24 30Z" fill={PINK} opacity="0.6" />
      <path d="M24 4C31 12 31 24 24 30C17 24 17 12 24 4Z" fill={PINK} />
    </>
  );
}

/** A lily pad from above, with its notch and veins. */
function Pad() {
  return (
    <>
      <path d="M24 24L42 14.9A20 20 0 1 0 43.9 26.1Z" fill={GREEN} />
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
      <circle cx="24" cy="24" r="16" fill={YELLOW} opacity="0.8" />
      <circle cx="24" cy="24" r="16" fill="none" stroke={GREEN} strokeWidth="2" />
      <g fill={GREEN}>
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
      <path d="M24 40L36 37A18 6 0 1 1 35 43Z" fill={GREEN} />
      <path d="M26 39C26 33 27 29 28 24" fill="none" stroke={GREEN} strokeWidth="2" />
      <path d="M28 24C23 21 22 14 24 9C26 13 27 18 28 24Z" fill={PINK} opacity="0.6" />
      <path d="M28 24C33 21 34 14 32 9C30 13 29 18 28 24Z" fill={PINK} opacity="0.6" />
      <path d="M28 2C33 8 33 18 28 24C23 18 23 8 28 2Z" fill={PINK} />
    </>
  );
}

/** Two fallen petals drifting on the water. */
function Petals() {
  return (
    <>
      <path d={PETAL} fill={PINK} transform="translate(16 30) rotate(-60)" />
      <path
        d={PETAL}
        fill={PINK}
        opacity="0.6"
        transform="translate(30 20) rotate(25) scale(0.8)"
      />
      <path
        d="M6 40Q16 37 26 40M22 45Q32 42 42 45"
        fill="none"
        stroke={GREEN}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  );
}

const MOTIFS: Record<LotusMotif, () => ReactNode> = {
  bloom: Bloom,
  bud: Bud,
  pad: Pad,
  pod: Pod,
  budOnPad: BudOnPad,
  petals: Petals,
};

/** Positions bleed past the card edge, so the drawing reads as a glimpse, not a badge. */
const PLACES: Record<LotusPlace, string> = {
  bottomRight: "-right-5 -bottom-6",
  topRight: "-top-6 -right-4",
  right: "top-1/2 -right-6 -translate-y-1/2",
};

export function CardLotus({ motif, place, tilt = 0 }: CardLotusProps) {
  const Motif = MOTIFS[motif];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 48 48"
      style={{ rotate: `${String(tilt)}deg` }}
      className={`pointer-events-none absolute -z-10 size-32 opacity-[0.16] ${PLACES[place]}`}
    >
      <Motif />
    </svg>
  );
}
