import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileDown } from "lucide-react";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getOrder } from "@/lib/server/commerce";
import { formatEur } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/orders/$id")({ component: OrderDetail });

function OrderDetail() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const { t, lang } = useI18n();
  const [pdfBusy, setPdfBusy] = useState(false);
  const orderQ = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder({ data: Number(id) }),
    enabled: Boolean(user),
  });
  if (isPending) {
    return (
      <Shell>
        <p className="p-10 text-sm text-muted">{t("common.loading")}</p>
      </Shell>
    );
  }
  if (!user) return <RedirectToSignIn />;
  const o = orderQ.data;
  if (orderQ.isPending) {
    return (
      <Shell>
        <p className="p-10 text-sm text-muted">{t("common.loading")}</p>
      </Shell>
    );
  }
  if (!o) {
    return (
      <Shell>
        <p className="p-10 text-sm text-muted">{t("orders.empty")}</p>
      </Shell>
    );
  }
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/orders" className="text-sm text-muted underline">
          {t("orders.title")}
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">{o.orderNo}</h1>
            <p className="mt-1 text-sm text-muted">
              {o.createdAt.slice(0, 16).replace("T", " ")} · {t(`orders.status.${o.status}`)}
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={pdfBusy}
            onClick={() => {
              setPdfBusy(true);
              void import("@/lib/order-pdf")
                .then((m) => m.downloadOrderPdf(o))
                .finally(() => setPdfBusy(false));
            }}
          >
            <FileDown className="size-4" />
            {t("orders.pdf")}
          </Button>
        </div>
        <div className="mt-8 rounded-xl border border-line bg-surface p-5 text-sm">
          <p className="font-medium">{o.companyName}</p>
          <p className="text-muted">
            {o.deliveryName}, {o.deliveryAddress}, {o.deliveryPostal} {o.deliveryCity}, {o.deliveryCountry}
          </p>
          {o.poNumber ? (
            <p className="mt-2 text-muted">
              {t("checkout.po")}: {o.poNumber}
            </p>
          ) : null}
          {o.notes ? <p className="mt-2 whitespace-pre-wrap">{o.notes}</p> : null}
        </div>
        <table className="mt-6 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="py-2">{t("product.sku")}</th>
              <th className="py-2">{t("catalog.sortName")}</th>
              <th className="py-2">{t("product.pcs")}</th>
              <th className="py-2 text-right">{t("product.net")}</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={i.id} className="border-t border-line">
                <td className="py-2 font-mono text-xs">{i.sku}</td>
                <td className="py-2">
                  {i.name}
                  {i.preorder ? (
                    <span className="ml-2 text-xs font-semibold uppercase text-accent">{t("order.preorder")}</span>
                  ) : null}
                </td>
                <td className="py-2 tabular-nums">{i.qty}</td>
                <td className="py-2 text-right tabular-nums">{formatEur(i.lineTotal, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-6 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t("cart.subtotal")}</dt>
            <dd className="tabular-nums">{formatEur(o.netTotal, lang)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t("checkout.vat", { n: o.vatRate })}</dt>
            <dd className="tabular-nums">{formatEur(o.vatTotal, lang)}</dd>
          </div>
          <div className="flex justify-between text-base font-medium">
            <dt>{t("checkout.total")}</dt>
            <dd className="tabular-nums">{formatEur(o.grandTotal, lang)}</dd>
          </div>
        </dl>
        {o.items.some((i) => i.preorder) ? (
          <p className="mt-6 text-sm text-muted">{t("order.partialShip")}</p>
        ) : null}
      </div>
    </Shell>
  );
}
