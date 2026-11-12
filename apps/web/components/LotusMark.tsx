/**
 * The Notch mark: a small lotus in the scheme's colors, used next to the name, on
 * empty states and (as a static copy in `app/icon.svg`) as the favicon. Decorative:
 * the text beside it carries the meaning.
 */
const PETAL = "M0 0C2.6 -3.2 2.6 -8.4 0 -12C-2.6 -8.4 -2.6 -3.2 0 0Z";

export function LotusMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
    >
      <g transform="translate(12 17)">
        <g fill="var(--md-sys-color-primary)" opacity="0.55">
          <path d={PETAL} transform="rotate(-72) scale(0.72)" />
          <path d={PETAL} transform="rotate(72) scale(0.72)" />
        </g>
        <g fill="var(--md-sys-color-primary)" opacity="0.8">
          <path d={PETAL} transform="rotate(-36) scale(0.88)" />
          <path d={PETAL} transform="rotate(36) scale(0.88)" />
        </g>
        <path d={PETAL} fill="var(--md-sys-color-primary)" />
      </g>
      <path
        d="M4 19.5Q12 22.5 20 19.5"
        fill="none"
        stroke="var(--md-sys-color-tertiary)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
