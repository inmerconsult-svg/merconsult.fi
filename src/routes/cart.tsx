import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui";
import { listProducts } from "@/lib/server/catalog";
import { productName } from "@/lib/catalog-helpers";
import { formatEur } from "@/lib/utils";
import { MIN_ORDER_NET, meetsMinOrder } from "@/lib/commerce-rules";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/store/cart";
import { useMyProfile } from "@/lib/auth/use-profile";
import { PendingNotice } from "./pending";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { t, lang } = useI18n();
  const { isAwaiting, isLoading } = useMyProfile();
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const productsQ = useQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const products = productsQ.data ?? [];
  const rows = lines
    .map((l) => {
      const p = products.find((x) => x.sku === l.sku);
      return p ? { ...l, product: p } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
  const net = rows.reduce((s, r) => s + r.qty * r.product.netPrice, 0);

  if (isLoading) {
    return (
      <Shell>
        <p className="p-10 text-sm text-muted">{t("common.loading")}</p>
      </Shell>
    );
  }
  if (isAwaiting) {
    return (
      <Shell>
        <PendingNotice />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-medium tracking-tight">{t("cart.title")}</h1>
        {rows.length === 0 ? (
          <div className="mt-8 rounded-xl border border-line bg-surface p-8">
            <p className="text-sm text-muted">{t("cart.empty")}</p>
            <Link to="/catalog" className="mt-4 inline-block">
              <Button>{t("cart.browse")}</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-lg text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">{t("product.sku")}</th>
                  <th className="px-4 py-3">{t("catalog.sortName")}</th>
                  <th className="px-4 py-3">{t("product.pcs")}</th>
                  <th className="px-4 py-3">{t("product.net")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.sku} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{r.sku}</td>
                    <td className="px-4 py-3">
                      <Link to="/product/$sku" params={{ sku: r.sku }} className="hover:underline">
                        {productName(r.product, lang)}
                      </Link>
                      {r.product.stock <= 0 ? (
                        <span className="ml-2 text-xs font-semibold uppercase text-accent">{t("order.preorder")}</span>
                      ) : null}
                      {r.qty < r.product.cartonQty ? (
                        <p className="mt-1 text-xs font-medium text-accent">
                          {t("cart.belowCarton", { n: r.product.cartonQty })}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <QtyInput
                        qty={r.qty}
                        onCommit={(n) => setQty(r.sku, n, r.product.cartonQty)}
                        onRemove={() => remove(r.sku)}
                      />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatEur(r.qty * r.product.netPrice, lang)}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" className="text-xs text-muted hover:text-accent" onClick={() => remove(r.sku)}>
                        {t("admin.remove")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <button type="button" className="text-sm text-muted underline" onClick={() => clear()}>
              {t("cart.clear")}
            </button>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted">{t("cart.subtotal")}</p>
              <p className="text-2xl font-medium tabular-nums">{formatEur(net, lang)}</p>
              {rows.some((r) => r.product.stock <= 0) ? (
                <p className="mt-2 max-w-xs text-sm text-muted">{t("order.partialShip")}</p>
              ) : null}
              {!meetsMinOrder(net) ? (
                <p className="mt-2 max-w-xs text-sm text-accent">{t("checkout.minOrder", { n: MIN_ORDER_NET })}</p>
              ) : null}
              {meetsMinOrder(net) ? (
                <Link to="/checkout" className="mt-3 inline-block">
                  <Button>{t("cart.checkout")}</Button>
                </Link>
              ) : (
                <Button className="mt-3" disabled>
                  {t("cart.checkout")}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

function QtyInput({
  qty,
  onCommit,
  onRemove,
}: {
  qty: number;
  onCommit: (n: number) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState(String(qty));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(qty));
  }, [qty, focused]);

  function applyOrAsk() {
    const n = Number(String(text).replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      if (window.confirm(t("cart.removeConfirm"))) onRemove();
      else setText(String(qty));
      return;
    }
    onCommit(Math.max(1, Math.round(n)));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      className="h-9 w-24 rounded-md border border-line px-2 tabular-nums"
      value={text}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const v = e.target.value.replace(/[^\d]/g, "");
        setText(v);
        const n = Number(v);
        if (Number.isFinite(n) && n >= 1) onCommit(n);
      }}
      onBlur={() => {
        setFocused(false);
        applyOrAsk();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}
