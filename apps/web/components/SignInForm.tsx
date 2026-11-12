"use client";

import { useActionState } from "react";

import { authClient } from "../lib/auth-client";
import { useI18n } from "../lib/i18n/client";
import { EmailField, FormMessage, SubmitButton } from "./form/fields";

type State =
  | { readonly status: "idle" }
  | { readonly status: "sent"; readonly email: string }
  | { readonly status: "error"; readonly message: string; readonly email: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email form for a sign-in link. The answer is the same whether or not the address may
 * sign in, so the form does not reveal who uses Notch.
 */
export function SignInForm({ minutes, linkExpired }: { minutes: number; linkExpired: boolean }) {
  const { t } = useI18n();
  const [state, action] = useActionState(
    async (_: State, form: FormData): Promise<State> => {
      const value = form.get("email");
      const email = typeof value === "string" ? value.trim() : "";
      if (!EMAIL.test(email)) return { status: "error", message: t("signIn.invalidEmail"), email };
      const { error } = await authClient.signIn.magicLink({
        email,
        callbackURL: "/",
        errorCallbackURL: "/sign-in?error=link",
      });
      if (!error) return { status: "sent", email };
      const message = error.status === 429 ? t("signIn.tooMany") : t("signIn.failed");
      return { status: "error", message, email };
    },
    { status: "idle" },
  );

  if (state.status === "sent") {
    return (
      <p role="status" className="body-large">
        {t("signIn.sent", { email: state.email, minutes })}
      </p>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {linkExpired && state.status === "idle" && <FormMessage message={t("signIn.linkExpired")} />}
      {state.status === "error" && <FormMessage message={state.message} />}
      <EmailField
        label={t("signIn.email")}
        name="email"
        defaultValue={state.status === "error" ? state.email : undefined}
        required
      />
      <div>
        <SubmitButton pendingLabel={t("signIn.sending")}>{t("signIn.submit")}</SubmitButton>
      </div>
    </form>
  );
}
