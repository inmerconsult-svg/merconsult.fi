import { useQuery } from "@tanstack/react-query";
import { ensureProfile } from "@/lib/server/commerce";
import { useCurrentUserState } from "./use-current-user";

export function useMyProfile() {
  const { user, isPending: authPending } = useCurrentUserState();
  const q = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () =>
      ensureProfile({
        data: { email: user?.primaryEmail, displayName: user?.displayName },
      }),
    enabled: Boolean(user),
  });
  const role = q.data?.role;
  return {
    profile: q.data ?? null,
    isLoading: authPending || Boolean(user && q.isPending),
    isApproved: role === "customer" || role === "admin",
    isAdmin: role === "admin",
    isAwaiting: role === "pending",
  };
}
