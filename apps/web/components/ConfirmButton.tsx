"use client";

import { Button, Dialog, DialogActions, DialogTrigger } from "@ductmofficial/sen-ui";
import type { ReactNode } from "react";

import { useI18n } from "../lib/i18n/client";
import { BUTTON, type ButtonStyle } from "./button-styles";

/**
 * A button that asks first in an M3 `alertdialog`, for actions that cannot be undone. The
 * dialog closes once `onConfirm` has been called.
 */
export function ConfirmButton({
  children,
  variant = "text",
  title,
  confirm,
  confirmLabel,
  danger = false,
  disabled = false,
  onConfirm,
}: {
  children: ReactNode;
  variant?: ButtonStyle;
  title: string;
  confirm: string;
  confirmLabel: string;
  danger?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  return (
    <DialogTrigger>
      <Button variant="secondary" className={BUTTON[variant]} disabled={disabled}>
        {children}
      </Button>
      <Dialog title={title} role="alertdialog">
        {({ close }) => (
          <>
            <p className="body-medium text-on-surface-variant">{confirm}</p>
            <DialogActions>
              <Button variant="secondary" className={BUTTON.text} onClick={close}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="secondary"
                className={danger ? BUTTON.danger : BUTTON.filled}
                onClick={() => {
                  onConfirm();
                  close();
                }}
              >
                {confirmLabel}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
