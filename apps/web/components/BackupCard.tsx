"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";

import { restoreBackupAction, type RestoreState } from "../app/settings/actions";
import { type BackupSummary, missingParts, summarizeBackup } from "../lib/backup-summary";
import { formatDate, todayInVietnam } from "../lib/format";
import { useI18n } from "../lib/i18n/client";
import { useHydrated } from "../lib/use-hydrated";
import { BUTTON } from "./button-styles";
import { ConfirmButton } from "./ConfirmButton";
import { Icon } from "./icons";

interface Summary extends Omit<BackupSummary, "exportedAt"> {
  readonly date: string;
}

/** Download a JSON backup; restore one after a summary and a confirmation. */
/** `canRestore` for owners: a restore replaces the whole family's records. */
export function BackupCard({ canRestore = true }: { canRestore?: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ file: File; summary: Summary } | null>(null);
  const [result, setResult] = useState<RestoreState | null>(null);
  const [pending, startTransition] = useTransition();
  // A file picked before hydration would be ignored: the change handler is not attached yet.
  const hydrated = useHydrated();

  const choose = async (chosen: File | undefined) => {
    setResult(null);
    setFile(null);
    if (!chosen) return;
    try {
      const { exportedAt, ...counts } = summarizeBackup(JSON.parse(await chosen.text()));
      const date = Number.isNaN(Date.parse(exportedAt))
        ? "?"
        : formatDate(todayInVietnam(new Date(exportedAt)), locale);
      setFile({ file: chosen, summary: { ...counts, date } });
    } catch {
      setResult({ ok: false, message: t("settings.restoreInvalid") });
    }
  };

  const restore = () => {
    if (!file) return;
    const form = new FormData();
    form.set("file", file.file);
    startTransition(async () => {
      const state = await restoreBackupAction(form);
      setResult(state);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      if (state.ok) router.refresh();
    });
  };

  return (
    <div className="space-y-4" aria-busy={pending}>
      <p className="body-medium text-on-surface-variant">{t("settings.backupIntro")}</p>
      <div className="flex flex-wrap gap-2">
        <a className={BUTTON.filled} href="/backup.json" download>
          <Icon name="download" size={18} />
          {t("settings.backupDownload")}
        </a>
        {canRestore && (
          <label
            htmlFor={inputId}
            className={`${BUTTON.outlined} cursor-pointer has-focus-visible:outline-2`}
          >
            <Icon name="upload" size={18} />
            {t("settings.restoreChoose")}
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              disabled={!hydrated}
              onChange={(e) => void choose(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      {file && (
        <div className="space-y-3 rounded-m3-md bg-secondary-container p-4 text-on-secondary-container">
          <p className="body-medium">{t("settings.restoreSummary", { ...file.summary })}</p>
          {missingParts(file.summary.version).length > 0 && (
            <p className="body-medium">
              {t("settings.restoreOlder", {
                version: file.summary.version,
                parts: new Intl.ListFormat(locale, { type: "conjunction" }).format(
                  missingParts(file.summary.version).map((part) =>
                    t(`settings.restorePart.${part}`),
                  ),
                ),
              })}
            </p>
          )}
          <ConfirmButton
            variant="danger"
            title={t("settings.restoreConfirmTitle")}
            confirm={t("settings.restoreConfirm")}
            confirmLabel={t("settings.restore")}
            danger
            disabled={pending}
            onConfirm={restore}
          >
            {pending ? t("settings.calendarWorking") : t("settings.restore")}
          </ConfirmButton>
        </div>
      )}

      <p
        role={result?.ok === false ? "alert" : "status"}
        className={`body-medium ${result?.ok === false ? "text-error" : ""}`}
      >
        {result?.message ?? ""}
      </p>
    </div>
  );
}
