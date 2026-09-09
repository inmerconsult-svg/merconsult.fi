import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { ProductCard } from "@/components/product-card";
import { Button, Input, Textarea } from "@/components/ui";
import { listProducts } from "@/lib/server/catalog";
import { GROUPS, productName, productFeatures } from "@/lib/catalog-helpers";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/store/cart";
import { roundToCarton } from "@/lib/utils";
import { useMyProfile } from "@/lib/auth/use-profile";

type Search = { group?: string; q?: string };

export const Route = createFileRoute("/catalog")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    group: typeof s.group === "string" ? s.group : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: Catalog,
});

function Catalog() {
  const { t, lang } = useI18n();
  const { isApproved } = useMyProfile();
  const search = Route.useSearch();
  const add = useCart((s) => s.add);
  const [q, setQ] = useState(search.q ?? "");
  const [sort, setSort] = useState<"name" | "sku" | "price" | "stock">("name");
  const [quick, setQuick] = useState("");
  const [quickMsg, setQuickMsg] = useState<string | null>(null);
  const productsQ = useQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const products = productsQ.data ?? [];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = products;
    if (search.group) list = list.filter((p) => p.group === search.group);
    if (needle) {
      list = list.filter((p) => {
        const blob =
          `${p.sku} ${p.ean ?? ""} ${productName(p, lang)} ${p.nameFi} ${p.categoryFi} ${productFeatures(p, lang).join(" ")} ${p.featuresFi.join(" ")}`.toLowerCase();
        return blob.includes(needle);
      });
    }
    const copy = [...list];
    copy.sort((a, b) => {
      if (sort === "sku") return a.sku.localeCompare(b.sku);
      if (sort === "price" && isApproved) return a.netPrice - b.netPrice;
      if (sort === "stock") return b.stock - a.stock;
      return productName(a, lang).localeCompare(productName(b, lang), lang);
    });
    return copy;
  }, [products, q, search.group, sort, lang, isApproved]);

  function addQuick() {
    const lines = quick.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    let n = 0;
    for (const line of lines) {
      const m = line.match(/^([A-Za-z0-9]+)\s+(\d+)/);
      if (!m) continue;
      const sku = m[1].toUpperCase();
      const qty = Number(m[2]);
      const p = products.find((x) => x.sku.toUpperCase() === sku);
      if (!p) continue;
      add(p.sku, roundToCarton(qty, p.cartonQty), p.cartonQty);
      n += 1;
    }
    setQuickMsg(t("catalog.count", { n }));
  }

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">{t("catalog.title")}</h1>
            <p className="mt-1 text-sm text-muted">{t("catalog.count", { n: filtered.length })}</p>
          </div>
          <Input
            className="max-w-md"
            placeholder={t("catalog.search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/catalog"
            search={{}}
            className={`rounded-full border px-3 py-1.5 text-sm ${!search.group ? "border-ink bg-ink text-paper" : "border-line bg-surface"}`}
          >
            {t("catalog.all")}
          </Link>
          {GROUPS.map((g) => (
            <Link
              key={g.id}
              to="/catalog"
              search={{ group: g.id }}
              className={`rounded-full border px-3 py-1.5 text-sm ${search.group === g.id ? "border-ink bg-ink text-paper" : "border-line bg-surface"}`}
            >
              {t(`groups.${g.id}`)}
            </Link>
          ))}
          <select
            className="ml-auto h-9 rounded-full border border-line bg-surface px-3 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label={t("catalog.sort")}
          >
            <option value="name">{t("catalog.sortName")}</option>
            <option value="sku">{t("catalog.sortSku")}</option>
            {isApproved ? <option value="price">{t("catalog.sortPrice")}</option> : null}
            <option value="stock">{t("catalog.sortStock")}</option>
          </select>
        </div>

        {isApproved ? (
          <details className="mt-6 rounded-xl border border-line bg-surface p-4">
            <summary className="cursor-pointer text-sm font-medium">{t("catalog.quick")}</summary>
            <p className="mt-2 text-xs text-muted">{t("catalog.quickHint")}</p>
            <Textarea className="mt-3" value={quick} onChange={(e) => setQuick(e.target.value)} />
            <div className="mt-3 flex items-center gap-3">
              <Button type="button" size="sm" onClick={addQuick}>
                {t("catalog.addLines")}
              </Button>
              {quickMsg ? <span className="text-sm text-muted">{quickMsg}</span> : null}
            </div>
          </details>
        ) : null}

        {productsQ.isPending ? (
          <p className="mt-10 text-sm text-muted">{t("common.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="mt-10 text-sm text-muted">{t("catalog.empty")}</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.sku} product={p} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
