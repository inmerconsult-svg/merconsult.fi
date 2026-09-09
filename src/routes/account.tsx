import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { Button, Field, Input } from "@/components/ui";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureProfile, updateProfile } from "@/lib/server/commerce";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, isPending } = useCurrentUserState();
  const { t, lang } = useI18n();
  const [form, setForm] = useState({
    displayName: "",
    companyName: "",
    vatNumber: "",
    phone: "",
    addressLine: "",
    postalCode: "",
    city: "",
    country: "FI",
  });
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    if (!userId || hydrated) return;
    let cancelled = false;
    void ensureProfile({
      data: { email: user?.primaryEmail, displayName: user?.displayName, language: lang },
    }).then((p) => {
      if (cancelled) return;
      setForm({
        displayName: p.displayName,
        companyName: p.companyName,
        vatNumber: p.vatNumber,
        phone: p.phone,
        addressLine: p.addressLine,
        postalCode: p.postalCode,
        city: p.city,
        country: p.country || "FI",
      });
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, hydrated, lang, user?.primaryEmail, user?.displayName]);

  if (isPending) {
    return (
      <Shell>
        <p className="p-10 text-sm text-muted">{t("common.loading")}</p>
      </Shell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ data: { ...form, language: lang } });
      toast.message(t("account.saved"));
    } catch (err) {
      toast.message(err instanceof Error ? err.message : t("auth.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <form className="mx-auto max-w-lg space-y-4 px-4 py-10" onSubmit={onSubmit}>
        <h1 className="text-3xl font-medium tracking-tight">{t("account.title")}</h1>
        <Field label={t("account.name")}>
          <Input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
        </Field>
        <Field label={t("account.company")}>
          <Input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
        </Field>
        <Field label={t("account.vat")}>
          <Input value={form.vatNumber} onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))} />
        </Field>
        <Field label={t("account.phone")}>
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </Field>
        <Field label={t("account.address")}>
          <Input value={form.addressLine} onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("account.postal")}>
            <Input value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
          </Field>
          <Field label={t("account.city")}>
            <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </Field>
          <Field label={t("account.country")}>
            <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
          </Field>
        </div>
        <Button type="submit" disabled={busy}>
          {t("account.save")}
        </Button>
      </form>
    </Shell>
  );
}
