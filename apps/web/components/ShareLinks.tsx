"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createShareLinkAction, revokeShareLinkAction } from "../app/settings/actions";
import { useI18n } from "../lib/i18n/client";
import { BUTTON } from "./button-styles";
import { ConfirmButton } from "./ConfirmButton";
import { TextField } from "./form/fields";
import { Icon } from "./icons";
import { Segmented } from "./Segmented";

type Duration = "week" | "month" | "never";

/** A child's link, with dates already formatted on the server in the page's language. */
export interface ShareLinkSummary {
  readonly url: string;
  /** Null: no expiry. */
  readonly expires: string | null;
  readonly expired: boolean;
  readonly lastViewed: string | null;
}

export interface ShareLinkItem {
  readonly childId: string;
  readonly name: string;
  readonly link: ShareLinkSummary | null;
}

/**
 * Public read-only links to each child's page: create one for a week, a month or until
 * revoked, copy or open it, replace or revoke it.
 */
export function ShareLinks({ items }: { items: readonly ShareLinkItem[] }) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <p className="body-medium text-on-surface-variant">{t("settings.shareIntro")}</p>
      <ul aria-label={t("settings.share")} className="divide-y divide-outline-variant">
        {items.map((item) => (
          <li key={item.childId} className="py-4 first:pt-0 last:pb-0">
            <ShareLinkRow item={item} showName={items.length > 1} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShareLinkRow({ item, showName }: { item: ShareLinkItem; showName: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [duration, setDuration] = useState<Duration>("month");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const { link, name, childId } = item;
  const active = link !== null && !link.expired;

  const create = () => {
    startTransition(async () => {
      await createShareLinkAction(childId, duration);
      setCopied(false);
      router.refresh();
    });
  };
  const revoke = () => {
    startTransition(async () => {
      await revokeShareLinkAction(childId);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3" aria-busy={pending}>
      {showName && <h3 className="title-medium">{name}</h3>}

      {link && active && (
        <div className="space-y-3 rounded-m3-md bg-secondary-container p-4 text-on-secondary-container">
          <TextField label={t("settings.shareLink", { name })} value={link.url} readOnly />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BUTTON.filled}
              onClick={() => {
                void navigator.clipboard.writeText(link.url).then(() => {
                  setCopied(true);
                });
              }}
            >
              <Icon name="copy" size={18} />
              {t("settings.shareCopy")}
            </button>
            <a className={BUTTON.outlined} href={link.url} target="_blank" rel="noreferrer">
              <Icon name="openInNew" size={18} />
              {t("settings.shareOpen")}
            </a>
          </div>
          <p role="status" className="body-small">
            {copied ? t("settings.shareCopied") : ""}
          </p>
        </div>
      )}

      {link && (
        <p className="body-medium">
          {link.expired
            ? t("settings.shareExpired", { date: link.expires ?? "" })
            : link.expires
              ? t("settings.shareExpires", { date: link.expires })
              : t("settings.shareNoExpiry")}{" "}
          {link.lastViewed
            ? t("settings.shareViewed", { date: link.lastViewed })
            : t("settings.shareUnviewed")}
        </p>
      )}

      <Segmented<Duration>
        legend={t("settings.shareDuration")}
        name={`share-duration-${childId}`}
        value={duration}
        onChange={setDuration}
        options={[
          { value: "week", label: t("settings.shareWeek") },
          { value: "month", label: t("settings.shareMonth") },
          { value: "never", label: t("settings.shareNever") },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        {active ? (
          <ConfirmButton
            variant="tonal"
            title={t("settings.shareNewTitle", { name })}
            confirm={t("settings.shareNewConfirm")}
            confirmLabel={t("settings.shareNew")}
            disabled={pending}
            onConfirm={create}
          >
            <Icon name="refresh" size={18} />
            {pending ? t("settings.calendarWorking") : t("settings.shareNew")}
          </ConfirmButton>
        ) : (
          <button type="button" className={BUTTON.filled} disabled={pending} onClick={create}>
            <Icon name="share" size={18} />
            {pending
              ? t("settings.calendarWorking")
              : t(link ? "settings.shareNew" : "settings.shareCreate")}
          </button>
        )}
        {link && (
          <ConfirmButton
            variant="dangerText"
            title={t("settings.shareRevokeTitle", { name })}
            confirm={t("settings.shareRevokeConfirm")}
            confirmLabel={t("settings.shareRevoke")}
            danger
            disabled={pending}
            onConfirm={revoke}
          >
            <Icon name="linkOff" size={18} />
            {t("settings.shareRevoke")}
          </ConfirmButton>
        )}
      </div>
    </div>
  );
}
