import type { ReactNode } from "react";

import type { FlowerMotif } from "./flowers/art";
import { DAYLILY_MOTIFS, DaylilyBackdrop, DaylilyMark } from "./flowers/daylily";
import { LOTUS_MOTIFS, LotusBackdrop, LotusMark } from "./flowers/lotus";

/**
 * Flower drawings for the two palettes. Each component renders the lotus and the
 * daylily version; `globals.css` shows the one of the current `data-palette`, so a
 * palette change in Settings repaints at once without a server round trip. All of
 * them are decorative: hidden from assistive technology, never under pointer events.
 */
export type { FlowerMotif } from "./flowers/art";
export type Palette = "lotus" | "daylily";
export type FlowerPlace = "bottomRight" | "topRight" | "right";

/** The mark next to the name and on empty states. With `palette`, only that flower. */
export function FlowerMark({
  size = 24,
  className = "",
  palette,
}: {
  size?: number;
  className?: string;
  palette?: Palette;
}) {
  const lotus = `shrink-0 ${className} ${palette ? "" : "flower-lotus"}`;
  const daylily = `shrink-0 ${className} ${palette ? "" : "flower-daylily"}`;
  if (palette === "lotus") return <LotusMark size={size} className={lotus} />;
  if (palette === "daylily") return <DaylilyMark size={size} className={daylily} />;
  return (
    <>
      <LotusMark size={size} className={lotus} />
      <DaylilyMark size={size} className={daylily} />
    </>
  );
}

const BACKDROP =
  "flower-backdrop pointer-events-none fixed -right-12 bottom-16 -z-10 w-[min(75vw,22rem)] md:right-2 md:bottom-0 print:hidden";

/** The large faint flower in the bottom corner of the window. Cards keep their own surface. */
export function FlowerBackdrop() {
  return (
    <>
      <LotusBackdrop className={`${BACKDROP} flower-lotus`} />
      <DaylilyBackdrop className={`${BACKDROP} flower-daylily`} />
    </>
  );
}

export interface CardFlowerProps {
  readonly motif: FlowerMotif;
  readonly place: FlowerPlace;
  /** Tilt in degrees, so the same motif does not always stand upright. */
  readonly tilt?: number;
}

/** Positions bleed past the card edge, so the drawing reads as a glimpse, not a badge. */
const PLACES: Record<FlowerPlace, string> = {
  bottomRight: "-right-5 -bottom-6",
  topRight: "-top-6 -right-4",
  right: "top-1/2 -right-6 -translate-y-1/2",
};

/**
 * A faint drawing at the edge of a card. Each card gets its own motif and place, so a
 * screen of cards reads like a garden rather than one stamp repeated. The card must be
 * `relative isolate overflow-hidden`: the drawing then sits above the card's
 * background and below its content.
 */
export function CardFlower({ motif, place, tilt = 0 }: CardFlowerProps) {
  const className = `pointer-events-none absolute -z-10 size-32 opacity-[0.16] ${PLACES[place]}`;
  const Lotus = LOTUS_MOTIFS[motif];
  const Daylily = DAYLILY_MOTIFS[motif];
  const frame = (palette: string, art: ReactNode) => (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 48 48"
      style={{ rotate: `${String(tilt)}deg` }}
      className={`${className} ${palette}`}
    >
      {art}
    </svg>
  );
  return (
    <>
      {frame("flower-lotus", <Lotus />)}
      {frame("flower-daylily", <Daylily />)}
    </>
  );
}
