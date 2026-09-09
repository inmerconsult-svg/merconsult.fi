import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, authEnabled } from "@/lib/auth/client";
import { completeRegistration } from "@/lib/server/commerce";
import { Shell } from "@/components/shell";
import { Button, Field, Input } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    vat: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authClient.signOut();
    } catch {
      /* ei sessiota */
    }
    const { error: err } = await authClient.signUp.email({
      email: form.email,
      password: form.password,
      name: form.name,
    });
    if (err) {
      setBusy(false);
      setError(err.message ?? t("auth.error"));
      return;
    }
    try {
      await authClient.getSession();
      await completeRegistration({
        data: {
          displayName: form.name,
          email: form.email,
          companyName: form.company,
          vatNumber: form.vat,
          phone: form.phone,
          language: lang,
        },
      });
    } catch (e) {
      console.error("[prego-signup]", e);
      setError(e instanceof Error ? e.message : t("auth.error"));
      setBusy(false);
      return;
    }
    setBusy(false);
    void nav({ to: "/pending" });
  }

  return (
    <Shell>
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-xl border border-line bg-surface p-8">
          <h1 className="text-2xl font-medium tracking-tight">{t("auth.signup")}</h1>
          <p className="mt-2 text-sm text-muted">{t("auth.lead")}</p>
          {authEnabled ? (
            <form className="mt-8 space-y-4" onSubmit={onSubmit}>
              <Field label={t("auth.name")}>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </Field>
              <Field label={t("account.company")}>
                <Input required value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
              </Field>
              <Field label={t("account.vat")}>
                <Input value={form.vat} onChange={(e) => setForm((f) => ({ ...f, vat: e.target.value }))} />
              </Field>
              <Field label={t("account.phone")}>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </Field>
              <Field label={t("auth.email")}>
                <Input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </Field>
              <Field label={t("auth.password")}>
                <Input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </Field>
              {error ? <p className="text-sm text-accent">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {t("auth.signup")}
              </Button>
            </form>
          ) : (
            <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
          )}
          <p className="mt-6 text-sm text-muted">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="font-medium text-ink underline">
              {t("auth.signin")}
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
