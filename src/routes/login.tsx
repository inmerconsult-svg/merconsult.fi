import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Shell } from "@/components/shell";
import { Button, Field, Input } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (err) {
      setError(err.message ?? t("auth.error"));
      return;
    }
    void nav({ to: "/catalog" });
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-6xl gap-0 px-4 py-12 lg:grid-cols-2 lg:items-stretch">
        <div className="relative hidden overflow-hidden rounded-l-xl lg:block">
          <img src="/images/hero-beauty.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-ink/45" />
          <p className="relative p-10 text-2xl font-medium text-paper">{t("auth.lead")}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-8 lg:rounded-l-none">
          <h1 className="text-2xl font-medium tracking-tight">{t("auth.welcome")}</h1>
          <p className="mt-2 text-sm text-muted">{t("auth.lead")}</p>
          {authEnabled ? (
            <form className="mt-8 space-y-4" onSubmit={onSubmit}>
              <Field label={t("auth.email")}>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </Field>
              <Field label={t("auth.password")}>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </Field>
              {error ? <p className="text-sm text-accent">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {t("auth.signin")}
              </Button>
              <p className="text-center text-sm">
                <Link to="/forgot-password" className="text-muted underline hover:text-ink">
                  {t("auth.forgot")}
                </Link>
              </p>
            </form>
          ) : (
            <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
          )}
          <p className="mt-6 text-center text-xs uppercase tracking-wider text-muted">{t("auth.or")}</p>
          {authEnabled ? (
            <div className="mt-3 space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/catalog" })}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          ) : null}
          <p className="mt-6 text-sm text-muted">
            {t("auth.noAccount")}{" "}
            <Link to="/register" className="font-medium text-ink underline">
              {t("auth.signup")}
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
