import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { StockBadge } from "./stock-badge";
import { Button } from "./ui";
import { DatasheetLink } from "./datasheet-link";
import { productName, categoryName, productImage, hasProductPhoto } from "@/lib/catalog-helpers";
import { formatEur } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/store/cart";
import { useMyProfile } from "@/lib/auth/use-profile";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useI18n();
  const add = useCart((s) => s.add);
  const photo = hasProductPhoto(product);
  const { isApproved, isAwaiting } = useMyProfile();
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <Link to="/product/$sku" params={{ sku: product.sku }} className="block">
        <div className={`relative aspect-card overflow-hidden ${photo ? "bg-surface" : "bg-ink"}`}>
          <img
            src={productImage(product)}
            alt=""
            className={
              photo
                ? "h-full w-full object-contain p-5 transition-transform duration-300 group-hover:scale-[1.03]"
                : "h-full w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-[1.03]"
            }
          />
          {photo ? null : <div className="absolute inset-0 bg-linear-to-t from-ink/70 to-transparent" />}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
            <span className={`font-mono text-xs tracking-wide ${photo ? "rounded bg-paper/90 px-1.5 py-0.5 text-muted" : "text-paper/90"}`}>
              {product.sku}
            </span>
            <span className="rounded-full bg-paper/90 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-ink">
              {categoryName(product, lang)}
            </span>
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link to="/product/$sku" params={{ sku: product.sku }} className="flex-1">
          <h3 className="text-base font-medium leading-snug tracking-tight text-ink">{productName(product, lang)}</h3>
        </Link>
        <StockBadge stock={product.stock} incoming={product.incoming} eta={product.eta} />
        <div className="mt-auto flex items-end justify-between gap-3">
          {isApproved ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">{t("product.net")}</p>
              <p className="font-medium tabular-nums text-ink">{formatEur(product.netPrice, lang)}</p>
              <p className="text-xs text-muted">
                {t("product.carton")} {product.cartonQty} {t("product.pcs")}
              </p>
            </div>
          ) : (
            <Link
              to={isAwaiting ? "/pending" : "/login"}
              className="max-w-40 text-xs leading-snug text-muted underline hover:text-ink"
            >
              {isAwaiting ? t("pending.short") : t("product.loginForPrice")}
            </Link>
          )}
          <div className="flex shrink-0 items-center gap-2">
            <DatasheetLink product={product} compact />
            {isApproved ? (
              <Button
                size="sm"
                onClick={() => add(product.sku, product.cartonQty, product.cartonQty)}
                aria-label={t("product.add")}
              >
                <Plus className="size-4" />
                {t("product.add")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
