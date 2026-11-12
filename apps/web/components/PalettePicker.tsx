"use client";

import { type CSSProperties, useState, useTransition } from "react";

import { setPaletteAction } from "../app/settings/actions";
import { useI18n } from "../lib/i18n/client";
import { FlowerMark, type Palette } from "./Flowers";
import { Segmented } from "./Segmented";

/**
 * Each option shows its flower in its own seed colors (those of scripts/generate-theme.mjs),
 * whatever the current palette.
 */
const SEEDS: Record<Palette, CSSProperties> = {
  lotus: {
    "--md-sys-color-primary": "#d9668c",
    "--md-sys-color-tertiary": "#4f8a3c",
    "--md-sys-color-warning": "#e3b23c",
  } as CSSProperties,
  daylily: {
    "--md-sys-color-primary": "#e0702c",
    "--md-sys-color-tertiary": "#5b8a3a",
    "--md-sys-color-warning": "#f2b33d",
  } as CSSProperties,
};

const swatch = (palette: Palette) => (
  <span style={SEEDS[palette]} className="flex">
    <FlowerMark palette={palette} size={20} />
  </span>
);

/**
 * Lotus or daylily colors and drawings. Both palettes are already in the page, so it
 * switches at once; the cookie lets the server render the choice on the next visit.
 */
export function PalettePicker({ initial }: { initial: Palette }) {
  const { t } = useI18n();
  const [palette, setPalette] = useState(initial);
  const [, startTransition] = useTransition();

  const choose = (value: Palette) => {
    setPalette(value);
    const root = document.documentElement;
    if (value === "lotus") delete root.dataset.palette;
    else root.dataset.palette = value;
    startTransition(() => setPaletteAction(value));
  };

  return (
    <Segmented
      legend={t("settings.palette")}
      name="palette"
      value={palette}
      onChange={choose}
      options={[
        {
          value: "lotus",
          label: t("settings.paletteLotus"),
          icon: swatch("lotus"),
        },
        {
          value: "daylily",
          label: t("settings.paletteDaylily"),
          icon: swatch("daylily"),
        },
      ]}
    />
  );
}
