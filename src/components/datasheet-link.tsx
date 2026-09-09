import { FileText } from "lucide-react";
import { datasheetDownloadName, skuHasDatasheet } from "@/lib/catalog-helpers";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useMyProfile } from "@/lib/auth/use-profile";
import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/types";

function datasheetHref(product: Product): string {
  return `/api/datasheets/${encodeURIComponent(product.sku)}`;
}

export function DatasheetLink({
  product,
  compact = false,
  className,
}: {
  product: Product;
  compact?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const { isApproved, isAwaiting } = useMyProfile();
  if (!product.datasheetUrl && !skuHasDatasheet(product.sku)) return null;
  if (!isApproved) {
    return (
      <Link
        to={isAwaiting ? "/pending" : "/login"}
        title={t("product.datasheetLogin")}
        aria-label={t("product.datasheetLogin")}
        className={cn(
          "inline-flex items-center justify-center border border-line bg-surface text-muted hover:text-ink",
          compact ? "size-9 rounded-md" : "h-11 rounded-lg px-4 text-sm",
          className,
        )}
      >
        <FileText className="size-4 shrink-0" />
        {compact ? null : t("product.datasheetLogin")}
      </Link>
    );
  }
  const filename = datasheetDownloadName(product);
  return (
    <a
      href={datasheetHref(product)}
      download={filename}
      type="application/pdf"
      title={filename}
      aria-label={t("product.datasheet")}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 border border-line bg-surface font-medium text-ink hover:bg-paper",
        compact ? "size-9 rounded-md" : "h-11 rounded-lg px-4 text-sm",
        className,
      )}
    >
      <FileText className="size-4 shrink-0" />
      {compact ? null : t("product.datasheet")}
    </a>
  );
}
