import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, authEnabled } from "@/lib/auth/client";
import { Shell } from "@/components/shell";
import { Button, Field, Input } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPassword });

function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (err) {
      setError(err.message ?? t("auth.error"));
      return;
    }
    setDone(true);
  }

  return (
    <Shell>
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-xl border border-line bg-surface p-8">
          <h1 className="text-2xl font-medium tracking-tight">{t("auth.forgot")}</h1>
          <p className="mt-2 text-sm text-muted">{t("auth.forgotLead")}</p>
          {done ? (
            <p className="mt-6 text-sm">{t("auth.forgotSent")}</p>
          ) : authEnabled ? (
            <form className="mt-8 space-y-4" onSubmit={onSubmit}>
              <Field label={t("auth.email")}>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </Field>
              {error ? <p className="text-sm text-accent">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {t("auth.forgotSend")}
              </Button>
            </form>
          ) : null}
          <p className="mt-6 text-sm">
            <Link to="/login" className="underline">
              {t("auth.signin")}
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
