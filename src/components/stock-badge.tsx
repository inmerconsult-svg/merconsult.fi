import { stockLevel } from "@/lib/utils";
import { formatEta } from "@/lib/commerce-rules";
import { useI18n } from "@/lib/i18n";

export function StockBadge({ stock, incoming, eta }: { stock: number; incoming?: number; eta?: string | null }) {
  const { t, lang } = useI18n();
  const level = stockLevel(stock);
  const label = t(`stock.${level}`);
  const when = stock <= 0 ? formatEta(eta, lang) : null;
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium">
      <span
        className={
          level === "ok"
            ? "size-2 rounded-full bg-stock-ok"
            : level === "low"
              ? "size-2 rounded-full bg-stock-low"
              : "size-2 rounded-full bg-stock-out"
        }
        aria-hidden
      />
      <span className={level === "ok" ? "text-stock-ok" : level === "low" ? "text-stock-low" : "text-stock-out"}>
        {label}
      </span>
      {when ? <span className="text-muted">· {t("stock.eta", { n: when })}</span> : null}
      {!when && stock <= 0 && incoming && incoming > 0 ? (
        <span className="text-muted">· {t("stock.incoming")}</span>
      ) : null}
    </span>
  );
}
