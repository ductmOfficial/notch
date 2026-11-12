/**
 * A faint lotus drawn behind the content: petals in the primary color, leaves and
 * stem in the tertiary color, the stamen in the warning (stamen yellow) color. It
 * follows the light and dark schemes, is hidden from assistive technology and never
 * takes pointer events. Cards keep their own surface, so text never sits on it.
 */

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

export function LotusBackdrop() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 440 440"
      className="lotus-backdrop pointer-events-none fixed -right-12 bottom-16 -z-10 w-[min(75vw,22rem)] md:right-2 md:bottom-0 print:hidden"
    >
      <g fill="none" stroke="var(--md-sys-color-tertiary)" strokeWidth="2" opacity="0.7">
        <ellipse cx="230" cy="402" rx="190" ry="22" />
        <ellipse cx="230" cy="402" rx="130" ry="13" />
      </g>
      <path
        d="M224 262C214 312 236 352 230 404"
        fill="none"
        stroke="var(--md-sys-color-tertiary)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <g fill="var(--md-sys-color-tertiary)">
        <path d={PAD} transform="translate(110 392) rotate(-6)" />
        <path d={PAD} transform="translate(352 396) scale(-0.72 0.72) rotate(-4)" />
      </g>
      <g transform="translate(224 262)">
        <g fill="var(--md-sys-color-primary)" opacity="0.55">
          {[...SIDE.angles, ...BACK.angles].map((angle, i) => (
            <path
              key={angle}
              d={i < SIDE.angles.length ? SIDE.path : BACK.path}
              transform={`rotate(${String(angle)})`}
            />
          ))}
        </g>
        <g fill="var(--md-sys-color-primary)">
          {FRONT.angles.map((angle) => (
            <path key={angle} d={FRONT.path} transform={`rotate(${String(angle)})`} />
          ))}
        </g>
        <ellipse cx="0" cy="-30" rx="26" ry="14" fill="var(--md-sys-color-warning)" />
      </g>
    </svg>
  );
}
