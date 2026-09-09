/** Minimum order value, net of VAT (EUR). */
export const MIN_ORDER_NET = 300;

export function meetsMinOrder(net: number): boolean {
  return net + 1e-9 >= MIN_ORDER_NET;
}

function dateOrNull(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

/**
 * Excel ETA. "30.9" / "8.9" = next time that day+month occurs
 * (this year if still ahead, otherwise next year).
 * Also accepts 30.9.2026 and 2026-09-30.
 */
export function resolveEta(raw: string | null | undefined, now = new Date()): Date | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return dateOrNull(Number(m[1]), Number(m[2]), Number(m[3]));

  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) {
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    return dateOrNull(year, Number(m[2]), Number(m[1]));
  }

  m = s.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisYear = dateOrNull(now.getFullYear(), month, day);
  if (!thisYear) return null;
  if (thisYear >= today) return thisYear;
  return dateOrNull(now.getFullYear() + 1, month, day);
}

export function hasArrivalDate(eta: string | null | undefined): boolean {
  if (resolveEta(eta)) return true;
  return Boolean(eta && String(eta).trim());
}

export function formatEta(eta: string | null | undefined, lang: string, now = new Date()): string | null {
  const d = resolveEta(eta, now);
  if (!d) {
    const s = eta ? String(eta).trim() : "";
    return s || null;
  }
  if (lang === "en") {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  const locale = lang === "sv" ? "sv-SE" : lang === "no" ? "nb-NO" : lang === "et" ? "et-EE" : "fi-FI";
  return d.toLocaleDateString(locale, { day: "numeric", month: "numeric", year: "numeric" });
}
