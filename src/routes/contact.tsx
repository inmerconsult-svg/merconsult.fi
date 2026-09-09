import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Shell } from "@/components/shell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({ component: ContactPage });

function ContactPage() {
  const { t } = useI18n();
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{t("nav.contact")}</p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">{t("contact.title")}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t("contact.lead")}</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted">{t("contact.sales")}</h2>
            <p className="mt-4 text-2xl font-medium tracking-tight">Olavi Barman</p>
            <p className="mt-1 text-sm text-muted">Suomen 585 Oy</p>
            <p className="mt-1 text-sm text-muted">
              {t("contact.vat")} 2840338-9
            </p>

            <dl className="mt-8 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-accent" />
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">{t("auth.email")}</dt>
                  <dd className="mt-0.5">
                    <a className="hover:underline" href="mailto:barmanol@gmail.com">
                      barmanol@gmail.com
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">{t("contact.phone")}</dt>
                  <dd className="mt-0.5">
                    <a className="hover:underline" href="tel:+358400777508">
                      0400 777 508
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">{t("contact.address")}</dt>
                  <dd className="mt-0.5">
                    Suvitie 15
                    <br />
                    16500 HERRALA
                  </dd>
                </div>
              </div>
            </dl>
          </article>

          <article className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted">{t("contact.roles")}</h2>
            <ul className="mt-6 space-y-5 text-sm leading-relaxed">
              <li>
                <p className="font-medium">Suomen 585 Oy</p>
                <p className="mt-1 text-muted">{t("contact.operator")}</p>
              </li>
              <li>
                <p className="font-medium">Inbound Finland Oy</p>
                <p className="mt-1 text-muted">{t("contact.importer")}</p>
              </li>
            </ul>
            <p className="mt-8 text-sm text-muted">{t("footer.prices")}</p>
          </article>
        </div>
      </div>
    </Shell>
  );
}
