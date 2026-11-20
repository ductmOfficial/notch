import type { GrowthLevel } from "@notch/growth";

import type { GrowthReading } from "../lib/growth-assessment";
import { Badge } from "./ui";

const TONES = { normal: "done", watch: "soon", doctor: "overdue" } as const satisfies Record<
  GrowthLevel,
  string
>;

/** WHO reading of the latest measurement: label, normal range, change and advice. */
export function GrowthReadingView({ reading }: { reading: GrowthReading }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge tone={TONES[reading.statusLevel]}>{reading.label}</Badge>
      {reading.range && (
        <p className="body-small tabular-nums text-on-surface-variant">{reading.range}</p>
      )}
      {reading.change && <p className="body-small tabular-nums">{reading.change}</p>}
      <p className="body-medium">{reading.advice}</p>
    </div>
  );
}
