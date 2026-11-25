import type { Milestone } from "@notch/db";
import Link from "next/link";

import { milestoneKindLabel } from "../lib/child-timeline";
import { formatDate } from "../lib/format";
import type { Locale } from "../lib/i18n/messages";

const TILE =
  "flex h-full min-h-36 flex-col gap-2 rounded-m3-lg bg-tertiary-container p-5 text-on-tertiary-container";

/** A milestone as a tile: when, what kind, what happened. With `href`, it opens the edit form. */
export function MilestoneTile({
  milestone,
  locale,
  href,
}: {
  milestone: Milestone;
  locale: Locale;
  href?: string;
}) {
  const content = (
    <>
      <span className="label-medium">
        {formatDate(milestone.happenedOn, locale)} · {milestoneKindLabel(milestone.kind, locale)}
      </span>
      <span className="title-large">{milestone.title}</span>
      {milestone.note && <span className="body-medium">{milestone.note}</span>}
    </>
  );
  return href ? (
    <Link href={href} className={`state-layer ${TILE}`}>
      {content}
    </Link>
  ) : (
    <div className={TILE}>{content}</div>
  );
}
