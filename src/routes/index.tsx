import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui";
import { GROUPS } from "@/lib/catalog-helpers";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { t } = useI18n();
  return (
    <Shell>
      <section className="relative overflow-hidden">
        <img src="/images/hero-kitchen.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/60" />
        <div className="relative mx-auto flex min-h-hero max-w-6xl flex-col justify-end gap-6 px-4 py-16 text-paper">
          <p className="text-xs font-medium uppercase tracking-widest text-paper/80">{t("brand.line")}</p>
          <h1 className="max-w-3xl text-4xl font-medium tracking-tight sm:text-5xl">{t("hero.title")}</h1>
          <p className="max-w-xl text-base leading-relaxed text-paper/85">{t("hero.lead")}</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/catalog">
              <Button size="lg" className="bg-accent text-paper hover:bg-accent-dark">
                {t("hero.cta")}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="border-paper/30 bg-paper/10 text-paper hover:bg-paper/20">
                {t("hero.secondary")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-medium tracking-tight">{t("how.title")}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="rounded-xl border border-line bg-surface p-5">
              <span className="font-mono text-xs text-accent">0{n}</span>
              <h3 className="mt-3 text-lg font-medium">{t(`how.${n}.t`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(`how.${n}.d`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((g) => (
            <Link
              key={g.id}
              to="/catalog"
              search={{ group: g.id }}
              className="group relative min-h-48 overflow-hidden rounded-xl"
            >
              <img
                src={g.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/30 to-ink/10" />
              <div className="relative flex h-full min-h-48 items-end p-5">
                <h3 className="text-xl font-medium tracking-tight text-paper">{t(`groups.${g.id}`)}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}
