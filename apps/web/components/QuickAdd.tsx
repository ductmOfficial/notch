"use client";

import { Button, Dialog, DialogTrigger } from "@ductmofficial/sen-ui";
import Link from "next/link";

import type { MessageKey } from "../lib/i18n/messages";
import { useI18n } from "../lib/i18n/client";
import { Icon, type IconName } from "./icons";

const ACTIONS: { href: string; label: MessageKey; hint: MessageKey; icon: IconName }[] = [
  {
    href: "/growth/new",
    label: "quickAdd.measurement",
    hint: "quickAdd.measurementHint",
    icon: "scale",
  },
  { href: "/vaccines/record", label: "quickAdd.dose", hint: "quickAdd.doseHint", icon: "vaccines" },
  {
    href: "/vaccines/appointments/new",
    label: "quickAdd.appointment",
    hint: "quickAdd.appointmentHint",
    icon: "event",
  },
];

/** M3 floating action button that opens the quick-add choices: one tap to the right form. */
export function QuickAdd({ placement }: { placement: "rail" | "floating" }) {
  const { t } = useI18n();
  return (
    <DialogTrigger>
      <Button
        variant="secondary"
        aria-label={t("quickAdd.title")}
        className={`state-layer size-14 rounded-m3-lg border-0 bg-primary-container p-0 text-on-primary-container shadow-[0_4px_8px_3px_rgb(0_0_0/0.15),0_1px_3px_rgb(0_0_0/0.3)] ${
          placement === "floating" ? "fixed right-4 bottom-24 z-20" : ""
        }`}
      >
        <Icon name="add" />
      </Button>
      <Dialog title={t("quickAdd.title")}>
        {({ close }) => (
          <ul className="-mx-6 mt-2">
            {ACTIONS.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  onClick={close}
                  className="state-layer flex items-center gap-4 px-6 py-3 text-on-surface"
                >
                  <span className="text-on-surface-variant">
                    <Icon name={a.icon} />
                  </span>
                  <span className="flex flex-col">
                    <span className="body-large">{t(a.label)}</span>
                    <span className="body-medium text-on-surface-variant">{t(a.hint)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
