import type { ReactNode } from "react";

import { type ArtProps, BLOOM, HEART, LEAF, type MotifKind } from "./art";

/**
 * Baby (em bé) drawings: a rattle, a pacifier, a bottle, a star, the moon with stars and
 * little footprints. `BLOOM` is the primary color (nursery lavender), `LEAF` the tertiary one
 * (baby blue) and `HEART` the "upcoming" color (butter yellow) in this palette.
 */

/** Marks drawn on top of a shape, such as the scale on the bottle. */
const PAPER = "var(--md-sys-color-surface)";

const n = (value: number) => String(Math.round(value * 100) / 100);

/** A rattle, `size` tall, its ball's centre on the origin. */
function Rattle({ size }: { size: number }) {
  const s = size;
  return (
    <g>
      <path
        d={`M0 ${n(s * 0.28)}V${n(s * 0.62)}`}
        stroke={HEART}
        strokeWidth={s * 0.09}
        strokeLinecap="round"
      />
      <circle cy={s * 0.72} r={s * 0.1} fill="none" stroke={HEART} strokeWidth={s * 0.06} />
      <circle r={s * 0.3} fill={BLOOM} />
      <path d={`M${n(-s * 0.3)} 0H${n(s * 0.3)}`} stroke={LEAF} strokeWidth={s * 0.07} />
      <g fill={HEART}>
        <circle cx={-s * 0.13} cy={-s * 0.13} r={s * 0.04} />
        <circle cx={s * 0.12} cy={-s * 0.16} r={s * 0.04} />
        <circle cx={s * 0.02} cy={s * 0.15} r={s * 0.04} />
      </g>
    </g>
  );
}

/** A pacifier seen from the front, `size` wide, centred on the origin. */
function Pacifier({ size }: { size: number }) {
  const s = size;
  return (
    <g>
      <ellipse cy={s * 0.3} rx={s * 0.14} ry={s * 0.2} fill={LEAF} />
      <ellipse rx={s * 0.42} ry={s * 0.24} fill={BLOOM} />
      <circle cy={-s * 0.3} r={s * 0.17} fill="none" stroke={HEART} strokeWidth={s * 0.07} />
      <circle r={s * 0.08} fill={HEART} />
    </g>
  );
}

/** A feeding bottle, `size` tall, its base centred on the origin. */
function Bottle({ size }: { size: number }) {
  const s = size;
  return (
    <g>
      <path
        d={`M${n(-s * 0.1)} ${n(-s * 0.8)}Q0 ${n(-s * 1.02)} ${n(s * 0.1)} ${n(-s * 0.8)}Z`}
        fill={HEART}
      />
      <rect
        x={-s * 0.2}
        y={-s * 0.82}
        width={s * 0.4}
        height={s * 0.12}
        rx={s * 0.04}
        fill={LEAF}
      />
      <rect
        x={-s * 0.17}
        y={-s * 0.7}
        width={s * 0.34}
        height={s * 0.7}
        rx={s * 0.09}
        fill={BLOOM}
      />
      <g stroke={PAPER} strokeWidth={s * 0.03} strokeLinecap="round" opacity="0.8">
        {[0.5, 0.36, 0.22].map((y) => (
          <path key={y} d={`M${n(-s * 0.08)} ${n(-s * y)}H${n(s * 0.02)}`} />
        ))}
      </g>
    </g>
  );
}

/** A five-pointed star, outer radius `r`, centred on the origin. */
function Star({ r, color = HEART }: { r: number; color?: string }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${n(Math.cos(angle) * radius)} ${n(Math.sin(angle) * radius)}`;
  });
  return <path d={`M${points.join("L")}Z`} fill={color} strokeLinejoin="round" />;
}

/**
 * A crescent moon, radius `r`, centred on the origin, opening to the right: the left half of
 * a circle, closed by a flatter arc (radius 1.25 r) that leaves it half a radius thick.
 */
function Moon({ r }: { r: number }) {
  return (
    <path
      d={`M0 ${n(-r)}A${n(r)} ${n(r)} 0 0 0 0 ${n(r)}A${n(r * 1.25)} ${n(r * 1.25)} 0 0 1 0 ${n(-r)}Z`}
      fill={BLOOM}
    />
  );
}

/** A baby's footprint, `size` long, its heel at the origin, toes up. */
function Foot({ size, mirror = false }: { size: number; mirror?: boolean }) {
  const s = size;
  return (
    <g fill={LEAF} transform={mirror ? "scale(-1 1)" : undefined}>
      <ellipse cy={-s * 0.32} rx={s * 0.2} ry={s * 0.34} />
      <circle cx={-s * 0.14} cy={-s * 0.78} r={s * 0.07} />
      <circle cx={-s * 0.02} cy={-s * 0.82} r={s * 0.06} />
      <circle cx={s * 0.09} cy={-s * 0.8} r={s * 0.055} />
      <circle cx={s * 0.18} cy={-s * 0.74} r={s * 0.05} />
      <circle cx={s * 0.24} cy={-s * 0.65} r={s * 0.045} />
    </g>
  );
}

/** Card drawings: a rattle, a pacifier, a bottle, a star, the moon, footprints. */
export const BABY_MOTIFS: Record<MotifKind, () => ReactNode> = {
  bloom: () => (
    <g transform="translate(24 17) rotate(-15)">
      <Rattle size={36} />
    </g>
  ),
  bud: () => (
    <g transform="translate(24 24)">
      <Pacifier size={36} />
    </g>
  ),
  leaf: () => (
    <g transform="translate(24 45) rotate(12)">
      <Bottle size={40} />
    </g>
  ),
  heart: () => (
    <g transform="translate(24 25)">
      <Star r={18} />
    </g>
  ),
  budOnLeaf: () => (
    <>
      <g transform="translate(22 26)">
        <Moon r={16} />
      </g>
      <g transform="translate(37 12)">
        <Star r={5} />
      </g>
      <g transform="translate(40 30)">
        <Star r={3.5} />
      </g>
    </>
  ),
  petals: () => (
    <>
      <g transform="translate(16 44) rotate(-8)">
        <Foot size={22} />
      </g>
      <g transform="translate(32 34) rotate(8)">
        <Foot size={22} mirror />
      </g>
    </>
  ),
};

/** The baby mark, 24 units square: a rattle. */
export function BabyMark({ size, className }: ArtProps & { size: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
    >
      <g transform="translate(12.5 8.5) rotate(-20)">
        <Rattle size={17} />
      </g>
    </svg>
  );
}

/** The nursery behind the content: the moon and stars, a rattle and little footprints. */
export function BabyBackdrop({ className }: ArtProps) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 440 440" className={className}>
      <g transform="translate(290 140)">
        <Moon r={80} />
      </g>
      <g transform="translate(130 90)">
        <Star r={26} />
      </g>
      <g transform="translate(400 60)">
        <Star r={18} />
      </g>
      <g transform="translate(200 230)">
        <Star r={14} />
      </g>
      <g transform="translate(340 300) rotate(-20)">
        <Rattle size={150} />
      </g>
      <g transform="translate(90 420) rotate(-10)" opacity="0.7">
        <Foot size={90} />
      </g>
      <g transform="translate(170 380) rotate(10)" opacity="0.7">
        <Foot size={90} mirror />
      </g>
    </svg>
  );
}
