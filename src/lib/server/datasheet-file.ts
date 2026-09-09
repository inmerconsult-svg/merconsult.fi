import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";
import datasheetFilenames from "@/data/datasheet-filenames.json";

const SAFE = /^[A-Za-z0-9._-]{1,80}$/;
const NAMES = datasheetFilenames as Record<string, string>;

function fileName(raw: string): string | null {
  const base = decodeURIComponent(raw || "").split("/").pop() || "";
  const trimmed = base.trim();
  const sku = trimmed.replace(/\.pdf$/i, "").toUpperCase();
  const name = `${sku}.pdf`;
  if (!SAFE.test(name) && !SAFE.test(trimmed)) return null;
  return SAFE.test(name) ? name : trimmed;
}

function skuFromName(name: string): string {
  return name.replace(/\.pdf$/i, "").toUpperCase();
}

function downloadName(name: string): string {
  const sku = skuFromName(name);
  return NAMES[sku] || name;
}

function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_") || "datasheet.pdf";
  const encoded = encodeURIComponent(filename).replace(/['()]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

async function readFromDisk(name: string): Promise<Buffer | null> {
  const sku = skuFromName(name);
  const candidates = Array.from(new Set([name, `${sku}.pdf`, name.toLowerCase(), name.toUpperCase()]));
  const roots = [
    join(process.cwd(), "private", "datasheets"),
    join(process.cwd(), "public", "datasheets"),
  ];
  for (const root of roots) {
    for (const candidate of candidates) {
      const path = join(root, candidate);
      if (!path.startsWith(root)) continue;
      if (existsSync(path)) return readFile(path);
    }
  }
  return null;
}

async function readFromNitro(name: string): Promise<Buffer | null> {
  try {
    const spec: string = "nitropack/runtime";
    const mod = (await import(spec)) as {
      useStorage?: (base?: string) => { getItemRaw: (key: string) => Promise<unknown> };
    };
    const useStorage = mod.useStorage;
    if (!useStorage) return null;
    const sku = skuFromName(name);
    const keys = Array.from(new Set([name, `${sku}.pdf`]));
    const storages = [useStorage("assets:datasheets"), useStorage("assets"), useStorage()];
    for (const storage of storages) {
      for (const key of keys) {
        const variants = [key, `datasheets:${key}`, `datasheets/${key}`];
        for (const variant of variants) {
          const data = await storage.getItemRaw(variant);
          if (!data) continue;
          if (Buffer.isBuffer(data)) return data;
          if (data instanceof Uint8Array) return Buffer.from(data);
          if (typeof data === "string") return Buffer.from(data);
        }
      }
    }
  } catch (err) {
    console.error("[datasheet] nitro storage", err);
  }
  return null;
}

async function readPdf(name: string): Promise<Buffer | null> {
  return (await readFromDisk(name)) || (await readFromNitro(name));
}

export async function serveDatasheet(request: Request, rawName: string): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", "/catalog");
    return Response.redirect(login.toString(), 302);
  }

  const sql = await getSql();
  const rows = await sql<{ role: string }>`select role from profiles where user_id = ${userId}`;
  const role = rows[0]?.role;
  if (role !== "admin" && role !== "customer") {
    return Response.redirect(new URL("/pending", request.url).toString(), 302);
  }

  const name = fileName(rawName);
  if (!name) return new Response("Not found", { status: 404 });
  const buf = await readPdf(name);
  if (!buf) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition(downloadName(name)),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
