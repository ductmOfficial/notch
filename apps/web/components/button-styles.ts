/**
 * M3 common buttons as class names, for Sen UI `Button`s and for links that look like buttons:
 * 40px high, fully rounded (Sen UI's --sen-button-radius), label-large text, a state layer.
 */
const base =
  "state-layer label-large inline-flex min-h-10 items-center justify-center gap-2 rounded-full whitespace-nowrap disabled:opacity-40";

export const BUTTON = {
  filled: `${base} border-0 bg-primary px-6 text-on-primary`,
  tonal: `${base} border-0 bg-secondary-container px-6 text-on-secondary-container`,
  outlined: `${base} border border-outline bg-transparent px-6 text-primary`,
  text: `${base} border-0 bg-transparent px-3 text-primary`,
  danger: `${base} border-0 bg-error px-6 text-on-error`,
  dangerText: `${base} border-0 bg-transparent px-3 text-error`,
} as const;

export type ButtonStyle = keyof typeof BUTTON;
