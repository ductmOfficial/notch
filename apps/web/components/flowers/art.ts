/** Shared pieces of the flower drawings. Colors are scheme roles, so each palette recolors them. */
export const BLOOM = "var(--md-sys-color-primary)";
export const LEAF = "var(--md-sys-color-tertiary)";
export const HEART = "var(--md-sys-color-warning)";

/** Card motifs; each palette draws its own flower for every one of them. */
export type FlowerMotif = "bloom" | "bud" | "leaf" | "heart" | "budOnLeaf" | "petals";

export interface ArtProps {
  readonly className?: string;
}
