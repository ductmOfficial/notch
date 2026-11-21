"use client";

import { type ReactNode, useState } from "react";

import { Segmented } from "./Segmented";

/**
 * Switches between server-rendered panels with a segmented button. Every panel is in the
 * page; only the chosen one shows, so switching needs no round trip.
 */
export function ChartSwitch({
  legend,
  options,
}: {
  legend: string;
  options: readonly { value: string; label: string; panel: ReactNode }[];
}) {
  const [value, setValue] = useState(options[0]?.value ?? "");
  return (
    <div className="space-y-4">
      <Segmented
        legend={legend}
        name="numerology-chart"
        value={value}
        options={options.map(({ value: v, label }) => ({ value: v, label }))}
        onChange={setValue}
      />
      {options.map((o) => (
        <div key={o.value} hidden={o.value !== value}>
          {o.panel}
        </div>
      ))}
    </div>
  );
}
