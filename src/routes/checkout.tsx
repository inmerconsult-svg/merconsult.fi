import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMyProfile } from "@/lib/auth/use-profile";
import { PendingNotice } from "./pending";
import { listProducts } from "@/lib/server/catalog";
import { ensureProfile, submitOrder, updateProfile } from "@/lib/server/commerce";
import { productName } from "@/lib/catalog-helpers";
import { formatEur } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/store/cart";
import { MIN_ORDER_NET, meetsMinOrder } from "@/lib/commerce-rules";
import type { Profile } from "@/lib/types";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const { user, isPending } = useCurrentUserState();
  const { isAwaiting } = useMyProfile();
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const productsQ = useQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [po, setPo] = useState("");
  const [notes, setNotes] = useState("");
  const [reverse, setReverse] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    vatNumber: "",
    phone: "",
    deliveryName: "",
    deliveryAddress: "",
    deliveryPostal: "",
    deliveryCity: "",
    deliveryCountry: "FI",
  });
  const [formReady, setFormReady] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    if (!userId || formReady) return;
    let cancelled = false;
    void ensureProfile({ data: { email: user?.primaryEmail, displayName: user?.displayName, language: lang } }).then(
      (p) => {
        if (cancelled) return;
        setProfile(p);
        setForm({
          companyName: p.companyName,
          vatNumber: p.vatNumber,
          phone: p.phone,
          deliveryName: p.displayName || p.companyName,
          deliveryAddress: p.addressLine,
          deliveryPostal: p.postalCode,
          deliveryCity: p.city,
          deliveryCountry: p.country || "FI",
        });
        setFormReady(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId, formReady, lang, user?.primaryEmail, user?.displayName]);

  if (isPending) {
    return (
      <Shell>
        <p className="p-10 text-sm text-muted">{t("common.loading")}</p>
      </Shell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  if (isAwaiting) {
    return (
      <Shell>
        <PendingNotice />
      </Shell>
    );
  }

  const products = productsQ.data ?? [];
  const rows = lines
    .map((l) => {
      const p = products.find((x) => x.sku === l.sku);
      return p ? { ...l, product: p } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
  const net = rows.reduce((s, r) => s + r.qty * r.product.netPrice, 0);
  const vatRate = reverse ? 0 : 25.5;
  const vat = Math.round(net * (vatRate / 100) * 100) / 100;
  const grand = net + vat;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rows.length) return;
    if (!meetsMinOrder(net)) {
      toast.message(t("checkout.minOrder", { n: MIN_ORDER_NET }));
      return;
    }
    setBusy(true);
    try {
      await updateProfile({
        data: {
          displayName: profile?.displayName || user?.displayName || "",
          companyName: form.companyName,
          vatNumber: form.vatNumber,
          phone: form.phone,
          addressLine: form.deliveryAddress,
          postalCode: form.deliveryPostal,
          city: form.deliveryCity,
          country: form.deliveryCountry,
          language: lang,
        },
      });
      const res = await submitOrder({
        data: {
          lines: rows.map((r) => ({ sku: r.sku, qty: r.qty })),
          poNumber: po,
          notes,
          reverseCharge: reverse,
          deliveryName: form.deliveryName,
          deliveryAddress: form.deliveryAddress,
          deliveryPostal: form.deliveryPostal,
          deliveryCity: form.deliveryCity,
          deliveryCountry: form.deliveryCountry,
        },
      });
      clear();
      toast.message(t("checkout.ok", { n: res.orderNo }));
      void nav({ to: "/orders/$id", params: { id: String(res.orderId) } });
    } catch (err) {
      toast.message(err instanceof Error ? err.message : t("auth.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <form className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-5" onSubmit={onSubmit}>
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-medium tracking-tight">{t("checkout.title")}</h1>
          {rows.length === 0 ? (
            <p className="mt-6 text-sm text-muted">
              {t("cart.empty")}{" "}
              <Link to="/catalog" className="underline">
                {t("cart.browse")}
              </Link>
            </p>
          ) : (
            <div className="mt-8 space-y-4">
              <Field label={t("account.company")}>
                <Input required value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("account.vat")}>
                  <Input value={form.vatNumber} onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))} />
                </Field>
                <Field label={t("account.phone")}>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </Field>
              </div>
              <h2 className="pt-2 text-sm font-medium">{t("checkout.delivery")}</h2>
              <Field label={t("account.name")}>
                <Input required value={form.deliveryName} onChange={(e) => setForm((f) => ({ ...f, deliveryName: e.target.value }))} />
              </Field>
              <Field label={t("account.address")}>
                <Input required value={form.deliveryAddress} onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t("account.postal")}>
                  <Input required value={form.deliveryPostal} onChange={(e) => setForm((f) => ({ ...f, deliveryPostal: e.target.value }))} />
                </Field>
                <Field label={t("account.city")}>
                  <Input required value={form.deliveryCity} onChange={(e) => setForm((f) => ({ ...f, deliveryCity: e.target.value }))} />
                </Field>
                <Field label={t("account.country")}>
                  <Input required value={form.deliveryCountry} onChange={(e) => setForm((f) => ({ ...f, deliveryCountry: e.target.value }))} />
                </Field>
              </div>
              <Field label={t("checkout.po")}>
                <Input value={po} onChange={(e) => setPo(e.target.value)} />
              </Field>
              <Field label={t("checkout.notes")}>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} />
                {t("checkout.reverse")}
              </label>
            </div>
          )}
        </div>
        <aside className="lg:col-span-2">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-medium">{t("cart.title")}</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {rows.map((r) => (
                <li key={r.sku} className="flex justify-between gap-3">
                  <span>
                    {r.sku} · {productName(r.product, lang)}
                    {r.product.stock <= 0 ? (
                      <span className="ml-1 font-semibold uppercase text-accent">{t("order.preorder")}</span>
                    ) : null}
                    <span className="block text-xs text-muted">
                      {r.qty} × {formatEur(r.product.netPrice, lang)}
                    </span>
                  </span>
                  <span className="tabular-nums">{formatEur(r.qty * r.product.netPrice, lang)}</span>
                </li>
              ))}
            </ul>
            {rows.some((r) => r.product.stock <= 0) ? (
              <p className="mt-4 text-sm text-muted">{t("order.partialShip")}</p>
            ) : null}
            <dl className="mt-6 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">{t("cart.subtotal")}</dt>
                <dd className="tabular-nums">{formatEur(net, lang)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t("checkout.vat", { n: vatRate })}</dt>
                <dd className="tabular-nums">{formatEur(vat, lang)}</dd>
              </div>
              <div className="flex justify-between text-base font-medium">
                <dt>{t("checkout.total")}</dt>
                <dd className="tabular-nums">{formatEur(grand, lang)}</dd>
              </div>
            </dl>
            {!meetsMinOrder(net) ? (
              <p className="mt-4 text-sm text-accent">{t("checkout.minOrder", { n: MIN_ORDER_NET })}</p>
            ) : null}
            <Button type="submit" className="mt-6 w-full" disabled={busy || rows.length === 0 || !meetsMinOrder(net)}>
              {t("checkout.submit")}
            </Button>
          </div>
        </aside>
      </form>
    </Shell>
  );
}
