import { create } from "zustand";
import { persist } from "zustand/middleware";
import { roundToCarton } from "@/lib/utils";
import type { CartLine } from "@/lib/types";

type CartState = {
  lines: CartLine[];
  add: (sku: string, qty: number, carton: number) => void;
  setQty: (sku: string, qty: number, carton: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (sku, qty, carton) => {
        const extra = Math.max(1, Math.round(qty) || 1);
        const lines = [...get().lines];
        const i = lines.findIndex((l) => l.sku === sku);
        if (i >= 0) {
          lines[i] = { sku, qty: lines[i].qty + extra };
        } else {
          lines.push({ sku, qty: roundToCarton(extra, carton) });
        }
        set({ lines });
      },
      setQty: (sku, qty, _carton) => {
        const n = Math.round(qty);
        if (!Number.isFinite(n) || n <= 0) return;
        set({
          lines: get().lines.map((l) => (l.sku === sku ? { sku, qty: n } : l)),
        });
      },
      remove: (sku) => set({ lines: get().lines.filter((l) => l.sku !== sku) }),
      clear: () => set({ lines: [] }),
    }),
    { name: "prego-cart" },
  ),
);
