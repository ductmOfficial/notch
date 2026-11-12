/**
 * Shared pieces of the drawings. Colors are scheme roles, so each palette recolors them: BLOOM is
 * the primary color, LEAF the tertiary one and HEART the "upcoming" one.
 */
export const BLOOM = "var(--md-sys-color-primary)";
export const LEAF = "var(--md-sys-color-tertiary)";
export const HEART = "var(--md-sys-color-warning)";

/** Card motifs; each palette has its own drawing for every one of them. */
export type MotifKind = "bloom" | "bud" | "leaf" | "heart" | "budOnLeaf" | "petals";

export interface ArtProps {
  readonly className?: string;
}
