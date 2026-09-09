import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Lang = "fi" | "en" | "sv" | "no" | "et";

export const LANGS: { id: Lang; label: string }[] = [
  { id: "fi", label: "Suomi" },
  { id: "en", label: "English" },
  { id: "sv", label: "Svenska" },
  { id: "no", label: "Norsk" },
  { id: "et", label: "Eesti" },
];

export function formatEur(n: number, lang: Lang = "fi"): string {
  const locale =
    lang === "en" ? "en-GB" : lang === "sv" ? "sv-SE" : lang === "no" ? "nb-NO" : lang === "et" ? "et-EE" : "fi-FI";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

export function stockLevel(stock: number): "ok" | "low" | "out" {
  if (stock <= 0) return "out";
  if (stock <= 10) return "low";
  return "ok";
}

export function roundToCarton(qty: number, carton: number): number {
  const c = Math.max(1, carton || 1);
  if (qty <= 0) return c;
  return Math.ceil(qty / c) * c;
}
