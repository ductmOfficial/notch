"use client";

import { Button, Dialog, DialogActions, DialogTrigger } from "@ductmofficial/sen-ui";

import { useI18n } from "../../lib/i18n/client";
import { BUTTON } from "../button-styles";
import { Icon } from "../icons";
import { SubmitButton } from "./fields";

/**
 * A delete button that asks first, in an M3 dialog (`alertdialog`), so a single tap never
 * deletes. The Server Action runs only from the dialog's own form.
 */
export function DeleteForm({
  action,
  childId,
  id,
  label,
  title,
  confirm,
}: {
  action: (form: FormData) => Promise<void>;
  childId: string;
  id: string;
  label: string;
  title: string;
  confirm: string;
}) {
  const { t } = useI18n();
  return (
    <DialogTrigger>
      <Button variant="secondary" className={BUTTON.dangerText}>
        <Icon name="delete" size={18} />
        {label}
      </Button>
      <Dialog title={title} role="alertdialog">
        {({ close }) => (
          <form action={action}>
            <input type="hidden" name="childId" value={childId} />
            <input type="hidden" name="id" value={id} />
            <p className="body-medium text-on-surface-variant">{confirm}</p>
            <DialogActions>
              <Button variant="secondary" className={BUTTON.text} onClick={close}>
                {t("common.cancel")}
              </Button>
              <SubmitButton variant="danger" pendingLabel={t("common.deleting")}>
                {t("common.delete")}
              </SubmitButton>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
