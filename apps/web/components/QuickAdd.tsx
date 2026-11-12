"use client";

import { Button, Dialog, DialogTrigger } from "@ductmofficial/sen-ui";
import Link from "next/link";

import { Icon, type IconName } from "./icons";

const ACTIONS: { href: string; label: string; hint: string; icon: IconName }[] = [
  {
    href: "/growth/new",
    label: "Thêm lần đo",
    hint: "Cân nặng, chiều dài, vòng đầu",
    icon: "scale",
  },
  {
    href: "/vaccines/record",
    label: "Ghi nhận mũi tiêm",
    hint: "Kèm lịch hẹn mũi kế tiếp",
    icon: "vaccines",
  },
  {
    href: "/vaccines/appointments/new",
    label: "Thêm lịch hẹn",
    hint: "Ngày phòng tiêm hẹn",
    icon: "event",
  },
];

/** M3 floating action button that opens the quick-add choices: one tap to the right form. */
export function QuickAdd({ placement }: { placement: "rail" | "floating" }) {
  return (
    <DialogTrigger>
      <Button
        variant="secondary"
        aria-label="Thêm nhanh"
        className={`state-layer size-14 rounded-m3-lg border-0 bg-primary-container p-0 text-on-primary-container shadow-[0_4px_8px_3px_rgb(0_0_0/0.15),0_1px_3px_rgb(0_0_0/0.3)] ${
          placement === "floating" ? "fixed right-4 bottom-24 z-20" : ""
        }`}
      >
        <Icon name="add" />
      </Button>
      <Dialog title="Thêm nhanh">
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
                    <span className="body-large">{a.label}</span>
                    <span className="body-medium text-on-surface-variant">{a.hint}</span>
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
