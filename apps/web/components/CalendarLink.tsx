"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createCalendarLinkAction, revokeCalendarLinkAction } from "../app/settings/actions";
import { useI18n } from "../lib/i18n/client";
import { BUTTON } from "./button-styles";
import { ConfirmButton } from "./ConfirmButton";
import { TextField } from "./form/fields";
import { Icon } from "./icons";

/** Dates already formatted on the server, in the page's language. */
export interface CalendarLinkSummary {
  readonly created: string;
  readonly lastUsed: string | null;
}

/**
 * The calendar subscription link: create it, see it once, copy it or open it in the
 * calendar app (webcal://), replace or revoke it. Only a hash is stored, so a link that
 * was not copied in time is replaced, not shown again.
 */
export function CalendarLink({ summary }: { summary: CalendarLinkSummary | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const create = () => {
    startTransition(async () => {
      const token = await createCalendarLinkAction();
      setUrl(`${window.location.origin}/calendar/${token}.ics`);
      setCopied(false);
      router.refresh();
    });
  };
  const revoke = () => {
    startTransition(async () => {
      await revokeCalendarLinkAction();
      setUrl(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4" aria-busy={pending}>
      <p className="body-medium text-on-surface-variant">{t("settings.calendarIntro")}</p>

      {url && (
        <div className="space-y-3 rounded-m3-md bg-secondary-container p-4 text-on-secondary-container">
          <TextField label={t("settings.calendarLink")} value={url} readOnly />
          <p className="body-small">{t("settings.calendarOnce")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BUTTON.filled}
              onClick={() => {
                void navigator.clipboard.writeText(url).then(() => {
                  setCopied(true);
                });
              }}
            >
              <Icon name="copy" size={18} />
              {t("settings.calendarCopy")}
            </button>
            <a className={BUTTON.outlined} href={url.replace(/^https?:/, "webcal:")}>
              <Icon name="calendarAdd" size={18} />
              {t("settings.calendarAdd")}
            </a>
          </div>
          <p role="status" className="body-small">
            {copied ? t("settings.calendarCopied") : ""}
          </p>
        </div>
      )}

      {summary && !url && (
        <p className="body-medium">
          {t("settings.calendarCreated", { date: summary.created })}{" "}
          {summary.lastUsed
            ? t("settings.calendarUsed", { date: summary.lastUsed })
            : t("settings.calendarUnused")}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {summary ? (
          <>
            <ConfirmButton
              variant="tonal"
              title={t("settings.calendarNewTitle")}
              confirm={t("settings.calendarNewConfirm")}
              confirmLabel={t("settings.calendarNew")}
              disabled={pending}
              onConfirm={create}
            >
              <Icon name="refresh" size={18} />
              {pending ? t("settings.calendarWorking") : t("settings.calendarNew")}
            </ConfirmButton>
            <ConfirmButton
              variant="dangerText"
              title={t("settings.calendarRevokeTitle")}
              confirm={t("settings.calendarRevokeConfirm")}
              confirmLabel={t("settings.calendarRevoke")}
              danger
              disabled={pending}
              onConfirm={revoke}
            >
              <Icon name="linkOff" size={18} />
              {t("settings.calendarRevoke")}
            </ConfirmButton>
          </>
        ) : (
          <button type="button" className={BUTTON.filled} disabled={pending} onClick={create}>
            <Icon name="event" size={18} />
            {pending ? t("settings.calendarWorking") : t("settings.calendarCreate")}
          </button>
        )}
      </div>
    </div>
  );
}
