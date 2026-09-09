import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Shell } from "@/components/shell";
import { Button, Field, Input } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const { t } = useI18n();
  const nav = useNavigate();
  const token =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") ?? "" : "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    if (!token) {
      setError(t("auth.resetMissing"));
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setBusy(false);
    if (err) {
      setError(err.message ?? t("auth.error"));
      return;
    }
    void nav({ to: "/login" });
  }

  return (
    <Shell>
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-xl border border-line bg-surface p-8">
          <h1 className="text-2xl font-medium tracking-tight">{t("auth.resetTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{t("auth.resetLead")}</p>
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <Field label={t("auth.resetNew")}>
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label={t("auth.resetConfirm")}>
              <Input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            {error ? <p className="text-sm text-accent">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {t("auth.resetSave")}
            </Button>
          </form>
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
