import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/shell";
import { OrderList } from "@/components/order-list";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMyProfile } from "@/lib/auth/use-profile";
import { PendingNotice } from "./pending";
import { listMyOrders } from "@/lib/server/commerce";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

function OrdersPage() {
  const { user, isPending } = useCurrentUserState();
  const { isAwaiting } = useMyProfile();
  const { t } = useI18n();
  const ordersQ = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: () => listMyOrders(),
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
        <h1 className="text-3xl font-medium tracking-tight">{t("orders.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("orders.lead")}</p>
        <div className="mt-8">
          <OrderList orders={ordersQ.data ?? []} />
        </div>
      </div>
    </Shell>
  );
}
