import type { ReactNode } from "react";

import { type ArtProps, BLOOM, HEART, LEAF, type MotifKind } from "./art";

/**
 * Teddy bear (gấu bông) drawings: the bear's head, a paw print, a honey pot, a bow, a heart
 * and the bear sitting. `BLOOM` is the primary color (caramel fur), `LEAF` the tertiary one
 * (the rose of its bow and inner ears) and `HEART` the "upcoming" color (honey) here.
 */

/**
 * Eyes and nose: a fixed dark brown, like a stitched face. A scheme role would turn light in
 * the dark theme, where the fur is light too, and the face would fade.
 */
const INK = "#2b1d14";

const n = (value: number) => String(Math.round(value * 100) / 100);

/** The bear's head, radius `r`, centred on the origin, ears included. */
function Head({ r, face = true }: { r: number; face?: boolean }) {
  return (
    <g>
      {[-1, 1].map((side) => (
        <g key={side}>
          <circle cx={side * r * 0.72} cy={-r * 0.72} r={r * 0.42} fill={BLOOM} />
          <circle cx={side * r * 0.72} cy={-r * 0.72} r={r * 0.22} fill={LEAF} />
        </g>
      ))}
      <circle r={r} fill={BLOOM} />
      <ellipse cy={r * 0.34} rx={r * 0.48} ry={r * 0.36} fill={HEART} />
      {face && (
        <g fill={INK}>
          <circle cx={-r * 0.36} cy={-r * 0.12} r={r * 0.1} />
          <circle cx={r * 0.36} cy={-r * 0.12} r={r * 0.1} />
          <ellipse cy={r * 0.2} rx={r * 0.15} ry={r * 0.11} />
        </g>
      )}
    </g>
  );
}

/** A paw print, `size` across, centred on the origin. */
function Paw({ size }: { size: number }) {
  const s = size;
  return (
    <g fill={BLOOM}>
      <ellipse cy={s * 0.14} rx={s * 0.3} ry={s * 0.25} />
      <ellipse cx={-s * 0.34} cy={-s * 0.12} rx={s * 0.11} ry={s * 0.14} />
      <ellipse cx={-s * 0.13} cy={-s * 0.3} rx={s * 0.11} ry={s * 0.14} />
      <ellipse cx={s * 0.13} cy={-s * 0.3} rx={s * 0.11} ry={s * 0.14} />
      <ellipse cx={s * 0.34} cy={-s * 0.12} rx={s * 0.11} ry={s * 0.14} />
    </g>
  );
}

/** A honey pot with its lid and a drip, `size` tall, its base centred on the origin. */
function HoneyPot({ size }: { size: number }) {
  const s = size;
  return (
    <g>
      <ellipse cy={-s * 0.36} rx={s * 0.42} ry={s * 0.36} fill={HEART} />
      <rect
        x={-s * 0.26}
        y={-s * 0.86}
        width={s * 0.52}
        height={s * 0.16}
        rx={s * 0.05}
        fill={HEART}
      />
      <rect
        x={-s * 0.33}
        y={-s * 0.96}
        width={s * 0.66}
        height={s * 0.13}
        rx={s * 0.06}
        fill={BLOOM}
      />
      <path
        d={`M${n(-s * 0.4)} ${n(-s * 0.46)}H${n(s * 0.4)}`}
        stroke={BLOOM}
        strokeWidth={s * 0.08}
        strokeLinecap="round"
      />
      <path
        d={`M${n(s * 0.12)} ${n(-s * 0.84)}V${n(-s * 0.62)}`}
        stroke={HEART}
        strokeWidth={s * 0.1}
        strokeLinecap="round"
      />
    </g>
  );
}

/** A ribbon bow, `size` wide, centred on the origin. */
function Bow({ size }: { size: number }) {
  const s = size;
  return (
    <g fill={LEAF}>
      <path
        d={`M0 0C${n(-s * 0.2)} ${n(-s * 0.32)} ${n(-s * 0.5)} ${n(-s * 0.3)} ${n(-s * 0.5)} 0C${n(-s * 0.5)} ${n(s * 0.3)} ${n(-s * 0.2)} ${n(s * 0.32)} 0 0Z`}
      />
      <path
        d={`M0 0C${n(s * 0.2)} ${n(-s * 0.32)} ${n(s * 0.5)} ${n(-s * 0.3)} ${n(s * 0.5)} 0C${n(s * 0.5)} ${n(s * 0.3)} ${n(s * 0.2)} ${n(s * 0.32)} 0 0Z`}
      />
      <path
        d={`M${n(-s * 0.06)} ${n(s * 0.04)}L${n(-s * 0.22)} ${n(s * 0.46)}M${n(s * 0.06)} ${n(s * 0.04)}L${n(s * 0.22)} ${n(s * 0.46)}`}
        stroke={LEAF}
        strokeWidth={s * 0.1}
        strokeLinecap="round"
      />
      <circle r={s * 0.11} />
    </g>
  );
}

/** A heart, `size` wide, centred on the origin. */
function Heart({ size, color = LEAF }: { size: number; color?: string }) {
  const s = size / 2;
  return (
    <path
      d={`M0 ${n(s * 0.8)}C${n(-s * 1.1)} ${n(s * 0.05)} ${n(-s * 1.05)} ${n(-s * 0.95)} ${n(-s * 0.5)} ${n(-s * 0.95)}C${n(-s * 0.2)} ${n(-s * 0.95)} 0 ${n(-s * 0.7)} 0 ${n(-s * 0.5)}C0 ${n(-s * 0.7)} ${n(s * 0.2)} ${n(-s * 0.95)} ${n(s * 0.5)} ${n(-s * 0.95)}C${n(s * 1.05)} ${n(-s * 0.95)} ${n(s * 1.1)} ${n(s * 0.05)} 0 ${n(s * 0.8)}Z`}
      fill={color}
    />
  );
}

/** The bear sitting, `size` tall, its base centred on the origin. */
function SittingBear({ size }: { size: number }) {
  const s = size;
  return (
    <g>
      <ellipse
        cx={-s * 0.28}
        cy={-s * 0.32}
        rx={s * 0.1}
        ry={s * 0.17}
        fill={BLOOM}
        transform={`rotate(25 ${n(-s * 0.28)} ${n(-s * 0.32)})`}
      />
      <ellipse
        cx={s * 0.28}
        cy={-s * 0.32}
        rx={s * 0.1}
        ry={s * 0.17}
        fill={BLOOM}
        transform={`rotate(-25 ${n(s * 0.28)} ${n(-s * 0.32)})`}
      />
      <ellipse cy={-s * 0.27} rx={s * 0.27} ry={s * 0.25} fill={BLOOM} />
      <ellipse cy={-s * 0.24} rx={s * 0.16} ry={s * 0.16} fill={HEART} />
      {[-1, 1].map((side) => (
        <g key={side}>
          <circle cx={side * s * 0.2} cy={-s * 0.07} r={s * 0.12} fill={BLOOM} />
          <circle cx={side * s * 0.22} cy={-s * 0.05} r={s * 0.065} fill={HEART} />
        </g>
      ))}
      <g transform={`translate(0 ${n(-s * 0.67)})`}>
        <Head r={s * 0.22} />
      </g>
      <g transform={`translate(${n(s * 0.18)} ${n(-s * 0.85)})`}>
        <Bow size={s * 0.2} />
      </g>
    </g>
  );
}

/** Card drawings: the head, a paw, a honey pot, a heart, a bow, a trail of paws. */
export const TEDDY_MOTIFS: Record<MotifKind, () => ReactNode> = {
  bloom: () => (
    <g transform="translate(24 27)">
      <Head r={14} face={false} />
    </g>
  ),
  bud: () => (
    <g transform="translate(24 26)">
      <Paw size={34} />
    </g>
  ),
  leaf: () => (
    <g transform="translate(24 44)">
      <HoneyPot size={38} />
    </g>
  ),
  heart: () => (
    <g transform="translate(24 25)">
      <Heart size={34} />
    </g>
  ),
  budOnLeaf: () => (
    <g transform="translate(24 24)">
      <Bow size={36} />
    </g>
  ),
  petals: () => (
    <>
      <g transform="translate(15 34) rotate(-20)">
        <Paw size={16} />
      </g>
      <g transform="translate(28 22) rotate(-10)">
        <Paw size={14} />
      </g>
      <g transform="translate(38 10)">
        <Paw size={12} />
      </g>
    </>
  ),
};

/** The teddy bear mark, 24 units square: the bear's head. */
export function TeddyMark({ size, className }: ArtProps & { size: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
    >
      <g transform="translate(12 13.5)">
        <Head r={7.5} />
      </g>
    </svg>
  );
}

/** Behind the content: the bear sitting, a honey pot, a heart and a trail of paws. */
export function TeddyBackdrop({ className }: ArtProps) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 440 440" className={className}>
      <g transform="translate(250 430)">
        <SittingBear size={300} />
      </g>
      <g transform="translate(400 430)">
        <HoneyPot size={90} />
      </g>
      <g transform="translate(110 150)">
        <Heart size={56} />
      </g>
      <g transform="translate(70 330) rotate(-25)" opacity="0.7">
        <Paw size={40} />
      </g>
      <g transform="translate(120 250) rotate(-15)" opacity="0.7">
        <Paw size={34} />
      </g>
    </svg>
  );
}
