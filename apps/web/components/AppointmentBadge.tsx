import type { AppointmentState } from "@notch/vaccines";

import type { Locale } from "../lib/i18n/messages";
import { dueLabel } from "../lib/vaccines-view";
import { Badge } from "./ui";

/** Status of an appointment; upcoming ones within a week are highlighted. */
export function AppointmentBadge({ state, locale }: { state: AppointmentState; locale: Locale }) {
  const tone =
    state.status === "overdue"
      ? "overdue"
      : state.status === "today"
        ? "today"
        : state.daysUntil !== undefined && state.daysUntil <= 7
          ? "soon"
          : "neutral";
  return <Badge tone={tone}>{dueLabel(state, locale)}</Badge>;
}
