import type { ReactNode } from "react";

import { type ArtProps, BLOOM, HEART, LEAF, type MotifKind } from "./art";

/**
 * Cloud (mây) drawings: cumulus clouds in sky blue with a sunset-peach underside, the sun,
 * a rainbow and birds. `BLOOM` is the primary color (sky blue), `LEAF` the tertiary one
 * (sunset peach) and `HEART` the "upcoming" color (sun yellow) in this palette.
 */

const n = (value: number) => String(Math.round(value * 100) / 100);

/** A cumulus cloud with a flat base, `size` wide, its base centred on the origin. */
function Cloud({ size, glow = true }: { size: number; glow?: boolean }) {
  const s = size / 4;
  return (
    <g>
      <g fill={BLOOM}>
        <circle cx={-s * 1.05} cy={-s * 0.62} r={s * 0.62} />
        <circle cx={-s * 0.2} cy={-s * 1.05} r={s * 0.95} />
        <circle cx={s * 0.85} cy={-s * 0.72} r={s * 0.72} />
        <rect x={-s * 1.67} y={-s * 0.75} width={s * 3.27} height={s * 0.75} rx={s * 0.37} />
      </g>
      {glow && (
        <path
          d={`M${n(-s * 1.3)} ${n(-s * 0.12)}H${n(s * 1.25)}`}
          stroke={LEAF}
          strokeWidth={s * 0.24}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

/** The sun with short rays, centred on the origin. */
function Sun({ r, rays = true }: { r: number; rays?: boolean }) {
  return (
    <g>
      {rays && (
        <g stroke={HEART} strokeWidth={r * 0.22} strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <path
              key={a}
              d={`M0 ${n(-r * 1.35)}L0 ${n(-r * 1.75)}`}
              transform={`rotate(${String(a)})`}
            />
          ))}
        </g>
      )}
      <circle r={r} fill={HEART} />
    </g>
  );
}

/** A rainbow of three bands (sky, sunset, sun), centred on the origin. */
function Rainbow({ r, band }: { r: number; band: number }) {
  return (
    <g fill="none" strokeWidth={band} strokeLinecap="round">
      {[BLOOM, LEAF, HEART].map((color, i) => {
        const radius = r - i * band;
        return (
          <path
            key={color}
            d={`M${n(-radius)} 0A${n(radius)} ${n(radius)} 0 0 1 ${n(radius)} 0`}
            stroke={color}
          />
        );
      })}
    </g>
  );
}

/** A bird in flight as two arcs. */
function Bird({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size / 2;
  return (
    <path
      d={`M${n(x - s)} ${n(y)}Q${n(x - s / 2)} ${n(y - s * 0.6)} ${n(x)} ${n(y)}Q${n(x + s / 2)} ${n(y - s * 0.6)} ${n(x + s)} ${n(y)}`}
      fill="none"
      stroke={BLOOM}
      strokeWidth={size * 0.12}
      strokeLinecap="round"
    />
  );
}

/** Card drawings: a big cloud, the sun peeking, stacked clouds, the sun, a rainbow, birds. */
export const CLOUD_MOTIFS: Record<MotifKind, () => ReactNode> = {
  bloom: () => (
    <g transform="translate(24 36)">
      <Cloud size={40} />
    </g>
  ),
  bud: () => (
    <>
      <g transform="translate(31 17)">
        <Sun r={7} />
      </g>
      <g transform="translate(21 38)">
        <Cloud size={30} />
      </g>
    </>
  ),
  leaf: () => (
    <>
      <g transform="translate(29 22)" opacity="0.6">
        <Cloud size={24} glow={false} />
      </g>
      <g transform="translate(19 40)">
        <Cloud size={30} />
      </g>
    </>
  ),
  heart: () => (
    <g transform="translate(24 24)">
      <Sun r={11} />
    </g>
  ),
  budOnLeaf: () => (
    <>
      <g transform="translate(24 40)">
        <Rainbow r={20} band={3.2} />
      </g>
      <g transform="translate(13 42)">
        <Cloud size={20} glow={false} />
      </g>
    </>
  ),
  petals: () => (
    <>
      <Bird x={16} y={18} size={12} />
      <Bird x={30} y={12} size={9} />
      <g transform="translate(26 40)">
        <Cloud size={28} />
      </g>
    </>
  ),
};

/** The cloud mark, 24 units square: a cloud with the sun peeking over it. */
export function CloudMark({ size, className }: ArtProps & { size: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
    >
      <g transform="translate(16 8.5)">
        <Sun r={3.4} rays={false} />
      </g>
      <g transform="translate(11 19.5)">
        <Cloud size={19} />
      </g>
    </svg>
  );
}

/** The sky behind the content: the sun, a rainbow, birds and a bank of clouds. */
export function CloudBackdrop({ className }: ArtProps) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 440 440" className={className}>
      <g transform="translate(320 120)">
        <Sun r={42} />
      </g>
      <g transform="translate(220 330)" opacity="0.7">
        <Rainbow r={170} band={20} />
      </g>
      <Bird x={110} y={150} size={34} />
      <Bird x={170} y={110} size={24} />
      <g transform="translate(120 360)">
        <Cloud size={190} />
      </g>
      <g transform="translate(330 420)">
        <Cloud size={210} />
      </g>
      <g transform="translate(250 250)" opacity="0.6">
        <Cloud size={110} glow={false} />
      </g>
    </svg>
  );
}
