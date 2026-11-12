import type { ComponentType, ReactNode } from "react";

import type { ArtProps, MotifKind } from "./motifs/art";
import { CLOUD_MOTIFS, CloudBackdrop, CloudMark } from "./motifs/cloud";
import { DAYLILY_MOTIFS, DaylilyBackdrop, DaylilyMark } from "./motifs/daylily";
import { LOTUS_MOTIFS, LotusBackdrop, LotusMark } from "./motifs/lotus";

/**
 * Drawings of each palette: lotus, daylily and cloud. Each component renders every
 * palette's version; `globals.css` shows the one of the current `data-palette`, so a
 * palette change in Settings repaints at once without a server round trip. All of
 * them are decorative: hidden from assistive technology, never under pointer events.
 */
export type { MotifKind } from "./motifs/art";
export const PALETTES = ["lotus", "daylily", "cloud"] as const;
export type Palette = (typeof PALETTES)[number];
export type MotifPlace = "bottomRight" | "topRight" | "right";

const ART: Record<
  Palette,
  {
    Mark: ComponentType<ArtProps & { size: number }>;
    Backdrop: ComponentType<ArtProps>;
    motifs: Record<MotifKind, () => ReactNode>;
  }
> = {
  lotus: { Mark: LotusMark, Backdrop: LotusBackdrop, motifs: LOTUS_MOTIFS },
  daylily: { Mark: DaylilyMark, Backdrop: DaylilyBackdrop, motifs: DAYLILY_MOTIFS },
  cloud: { Mark: CloudMark, Backdrop: CloudBackdrop, motifs: CLOUD_MOTIFS },
};

/** The mark next to the name and on empty states. With `palette`, only that palette's. */
export function MotifMark({
  size = 24,
  className = "",
  palette,
}: {
  size?: number;
  className?: string;
  palette?: Palette;
}) {
  if (palette) {
    const { Mark } = ART[palette];
    return <Mark size={size} className={`shrink-0 ${className}`} />;
  }
  return PALETTES.map((p) => {
    const { Mark } = ART[p];
    return <Mark key={p} size={size} className={`shrink-0 ${className} motif-${p}`} />;
  });
}

const BACKDROP =
  "motif-backdrop pointer-events-none fixed -right-12 bottom-16 -z-10 w-[min(75vw,22rem)] md:right-2 md:bottom-0 print:hidden";

/** The large faint drawing in the bottom corner of the window. Cards keep their own surface. */
export function MotifBackdrop() {
  return PALETTES.map((p) => {
    const { Backdrop } = ART[p];
    return <Backdrop key={p} className={`${BACKDROP} motif-${p}`} />;
  });
}

export interface CardMotifProps {
  readonly kind: MotifKind;
  readonly place: MotifPlace;
  /** Tilt in degrees, so the same motif does not always stand upright. */
  readonly tilt?: number;
}

/** Positions bleed past the card edge, so the drawing reads as a glimpse, not a badge. */
const PLACES: Record<MotifPlace, string> = {
  bottomRight: "-right-5 -bottom-6",
  topRight: "-top-6 -right-4",
  right: "top-1/2 -right-6 -translate-y-1/2",
};

/**
 * A faint drawing at the edge of a card. Each card gets its own motif and place, so a
 * screen of cards reads like a garden (or a sky) rather than one stamp repeated. The card
 * must be `relative isolate overflow-hidden`: the drawing then sits above the card's
 * background and below its content.
 */
export function CardMotif({ kind, place, tilt = 0 }: CardMotifProps) {
  return PALETTES.map((p) => {
    const Art = ART[p].motifs[kind];
    return (
      <svg
        key={p}
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 48 48"
        style={{ rotate: `${String(tilt)}deg` }}
        className={`pointer-events-none absolute -z-10 size-32 opacity-[0.16] ${PLACES[place]} motif-${p}`}
      >
        <Art />
      </svg>
    );
  });
}
