import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { signOut } from "@/lib/auth/client";
import { useI18n } from "@/lib/i18n";
import { LANGS } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { ensureProfile } from "@/lib/server/commerce";
import type { Profile } from "@/lib/types";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <img src="/prego-logo.png" alt="Prego" className="h-10 w-auto max-w-[42vw] object-contain object-left sm:h-12 md:h-14" />
          <span className="hidden text-xs uppercase tracking-widest text-muted lg:block">{t("brand.sub")}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/catalog" className="hover:text-accent">
            {t("nav.catalog")}
          </Link>
          <Link to="/contact" className="hover:text-accent">
            {t("nav.contact")}
          </Link>
          <SignedIn>
            <Link to="/orders" className="hover:text-accent">
              {t("nav.orders")}
            </Link>
            <Link to="/account" className="hover:text-accent">
              {t("nav.account")}
            </Link>
            <AdminLink label={t("nav.admin")} />
          </SignedIn>
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LangSwitch className="hidden md:flex" />
          <Link
            to="/cart"
            className="relative grid size-11 place-items-center rounded-lg hover:bg-line/50"
            aria-label={t("nav.cart")}
          >
            <ShoppingBag className="size-5" />
            {mounted && count > 0 ? (
              <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-xs font-semibold text-paper">
                {count}
              </span>
            ) : null}
          </Link>
          <AuthSlot loginLabel={t("nav.login")} mounted={mounted} />
          <button
            type="button"
            className="grid size-11 place-items-center rounded-lg md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-line px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium">
            <Link to="/catalog">{t("nav.catalog")}</Link>
            <Link to="/contact">{t("nav.contact")}</Link>
            <SignedIn>
              <Link to="/orders">{t("nav.orders")}</Link>
              <Link to="/account">{t("nav.account")}</Link>
              <AdminLink label={t("nav.admin")} />
              <LogoutLink />
            </SignedIn>
            <SignedOut>
              <Link to="/login">{t("nav.login")}</Link>
              <Link to="/register">{t("nav.register")}</Link>
            </SignedOut>
            <LangSwitch className="mt-2 flex" />
          </div>
        </div>
      ) : null}
    </header>
  );
}

function LogoutLink() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="text-left text-sm font-medium text-muted hover:text-ink"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void signOut().catch(() => setBusy(false));
      }}
    >
      {t("nav.logout")}
    </button>
  );
}

function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`items-center gap-0.5 text-xs font-medium ${className ?? ""}`}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => setLang(l.id)}
          className={
            lang === l.id
              ? "rounded-md bg-ink px-2 py-1 text-paper"
              : "rounded-md px-2 py-1 text-muted hover:text-ink"
          }
        >
          {l.id.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function AuthSkeleton() {
  return <div className="hidden h-9 w-20 rounded-lg bg-line sm:block" />;
}

function AuthSlot({ loginLabel, mounted }: { loginLabel: string; mounted: boolean }) {
  const { user, isPending } = useCurrentUserState();
  if (!mounted || isPending) return <AuthSkeleton />;
  if (!user) {
    return (
      <Link
        to="/login"
        className="hidden h-9 items-center rounded-lg border border-line px-3 text-sm font-medium sm:flex"
      >
        {loginLabel}
      </Link>
    );
  }
  return <AccountChip />;
}

function AccountChip() {
  const user = useCurrentUser();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Link to="/account" className="max-w-32 truncate text-sm font-medium">
        {label}
      </Link>
      <button
        type="button"
        className="text-xs text-muted hover:text-ink"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void signOut().catch(() => setBusy(false));
        }}
      >
        {t("nav.logout")}
      </button>
    </div>
  );
}

function AdminLink({ label }: { label: string }) {
  const { user, isPending } = useCurrentUserState();
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    void ensureProfile({
      data: { email: user.primaryEmail, displayName: user.displayName },
    })
      .then((p: Profile) => setRole(p.role))
      .catch(() => setRole(null));
  }, [user]);
  if (isPending || role !== "admin") return null;
  return (
    <Link to="/admin" className="hover:text-accent">
      {label}
    </Link>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <img src="/prego-logo.png" alt="Prego" className="h-16 w-auto" />
        </div>
        <div className="text-sm text-muted">
          <p>{t("footer.op")}</p>
          <p className="mt-1">{t("footer.prices")}</p>
          <Link to="/contact" className="mt-3 inline-block hover:text-ink">
            {t("nav.contact")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function ProfileSync() {
  const { user } = useCurrentUserState();
  const { lang } = useI18n();
  useEffect(() => {
    if (!user) return;
    void ensureProfile({
      data: { email: user.primaryEmail, displayName: user.displayName, language: lang },
    }).catch(() => undefined);
  }, [user, lang]);
  return null;
}
