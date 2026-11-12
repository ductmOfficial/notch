"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { authClient } from "../lib/auth-client";
import { useI18n } from "../lib/i18n/client";
import { BUTTON } from "./button-styles";

/** Ends the session on the server, then goes to the sign-in page. */
export function SignOutButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={BUTTON.outlined}
      onClick={() => {
        startTransition(async () => {
          await authClient.signOut();
          router.replace("/sign-in");
          router.refresh();
        });
      }}
    >
      {t("settings.signOut")}
    </button>
  );
}
