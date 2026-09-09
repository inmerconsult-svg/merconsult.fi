import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { ProductCard } from "@/components/product-card";
import { StockBadge } from "@/components/stock-badge";
import { DatasheetLink } from "@/components/datasheet-link";
import { Button } from "@/components/ui";
import { getProduct, listProducts } from "@/lib/server/catalog";
import { categoryName, hasProductPhoto, productFeatures, productImage, productName } from "@/lib/catalog-helpers";
import { formatEur, roundToCarton } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/store/cart";
import { useMyProfile } from "@/lib/auth/use-profile";

export const Route = createFileRoute("/product/$sku")({ component: ProductPage });

function ProductPage() {
  const { sku } = Route.useParams();
  const { t, lang } = useI18n();
  const add = useCart((s) => s.add);
  const { isApproved, isAwaiting } = useMyProfile();
  const productQ = useQuery({ queryKey: ["product", sku], queryFn: () => getProduct({ data: sku }) });
  const allQ = useQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const p = productQ.data;
  const [qty, setQty] = useState<number | null>(null);
  if (productQ.isPending) {
    return (
      <Shell>
        <p className="p-10 text-sm text-muted">{t("common.loading")}</p>
      </Shell>
    );
  }
  if (!p) {
    return (
      <Shell>
        <p className="p-10 text-sm text-muted">{t("product.unavailable")}</p>
      </Shell>
    );
  }
  const amount = qty ?? p.cartonQty;
  const related = (allQ.data ?? []).filter((x) => x.categoryCode === p.categoryCode && x.sku !== p.sku).slice(0, 3);
  const features = productFeatures(p, lang);
  const photo = hasProductPhoto(p);
  return (
    <Shell>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2">
        <div className={`overflow-hidden rounded-xl border border-line ${photo ? "bg-surface" : "bg-ink"}`}>
          <img
            src={productImage(p)}
            alt=""
            className={photo ? "h-full min-h-80 w-full object-contain p-8" : "h-full min-h-80 w-full object-cover opacity-90"}
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            {t(`groups.${p.group}`)} · {categoryName(p, lang)}
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight">{productName(p, lang)}</h1>
          <p className="mt-4 font-mono text-sm text-muted">
            {t("product.sku")} {p.sku}
            {p.ean ? ` · ${t("product.ean")} ${p.ean}` : ""}
          </p>
          <div className="mt-4">
            <StockBadge stock={p.stock} incoming={p.incoming} eta={p.eta} />
          </div>
          {p.stock <= 0 ? <p className="mt-3 text-sm text-muted">{t("product.backorderNote")}</p> : null}
          {isApproved ? (
            <>
              <p className="mt-8 text-xs uppercase tracking-wider text-muted">{t("product.net")}</p>
              <p className="text-3xl font-medium tabular-nums">{formatEur(p.netPrice, lang)}</p>
              <p className="mt-1 text-sm text-muted">
                {t("product.carton")} {p.cartonQty} {t("product.pcs")}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min={p.cartonQty}
                  step={p.cartonQty}
                  value={amount}
                  onChange={(e) => setQty(roundToCarton(Number(e.target.value), p.cartonQty))}
                  className="h-11 w-28 rounded-lg border border-line bg-surface px-3 tabular-nums"
                />
                <Button
                  onClick={() => {
                    add(p.sku, amount, p.cartonQty);
                  }}
                >
                  {t("product.add")}
                </Button>
                {p.datasheetUrl ? <DatasheetLink product={p} /> : null}
              </div>
            </>
          ) : (
            <>
              <p className="mt-8 max-w-sm text-sm text-muted">
                {isAwaiting ? t("pending.lead") : t("product.loginForPrice")}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {isAwaiting ? (
                  <Link to="/pending">
                    <Button>{t("pending.short")}</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button>{t("nav.login")}</Button>
                    </Link>
                    <Link to="/register">
                      <Button variant="secondary">{t("nav.register")}</Button>
                    </Link>
                  </>
                )}
                {p.datasheetUrl ? <DatasheetLink product={p} /> : null}
              </div>
            </>
          )}
          {features.length ? (
            <div className="mt-8">
              <h2 className="text-xs uppercase tracking-wider text-muted">{t("product.features")}</h2>
              <ul className="mt-3 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <Link to="/catalog" search={{ group: p.group }} className="mt-8 inline-block text-sm text-muted underline">
            {t("catalog.title")}
          </Link>
        </div>
      </div>
      {related.length ? (
        <div className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-xl font-medium">{t("product.related")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <ProductCard key={r.sku} product={r} />
            ))}
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
