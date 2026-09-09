/**
 * indic8 Storage Policy & Governance
 * 
 * Rules:
 * 1. DATABASE = AUTHORITATIVE SOURCE OF TRUTH (Supabase PostgreSQL).
 * 2. LOCALSTORAGE = Small, non-sensitive client preferences (theme, sidebar, last filters).
 * 3. INDEXEDDB = Disposable client-side cache & drafts (recent queries, charts, studio drafts).
 * 4. NEVER STORE SECRETS ON CLIENT (No API keys, access tokens, or private keys in browser storage).
 */

export const STORAGE_POLICY = {
  version: "1.0",
  maxIndexedDbSizeMB: 25,
  defaultCacheTtlMinutes: 15,
  financialCacheTtlMinutes: 5,
} as const;

export type StorageClassification =
  | "authoritative_db"
  | "local_preference"
  | "disposable_cache"
  | "studio_draft"
  | "secret_server_only";

export function getStorageClassification(key: string): StorageClassification {
  if (
    key.includes("key") ||
    key.includes("token") ||
    key.includes("secret") ||
    key.includes("password") ||
    key.includes("credential")
  ) {
    return "secret_server_only";
  }

  if (
    key === "theme" ||
    key === "sidebar_layout" ||
    key === "sidebar_expanded" ||
    key === "last_date_range" ||
    key === "table_density" ||
    key === "studio_ui_preferences"
  ) {
    return "local_preference";
  }

  if (key.startsWith("draft_studio_")) {
    return "studio_draft";
  }

  if (key.startsWith("cache_query_") || key.startsWith("cache_chart_")) {
    return "disposable_cache";
  }

  return "authoritative_db";
}

export function assertClientStorageSafe(key: string, value: unknown): void {
  const classification = getStorageClassification(key);
  if (classification === "secret_server_only") {
    throw new Error(
      `[Security Violation] Attempted to write sensitive secret "${key}" to browser client storage. Secrets must remain server-side only.`
    );
  }

  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.startsWith("sk_live_") ||
      lower.startsWith("rk_live_") ||
      lower.startsWith("polar_oat_") ||
      lower.includes("-----begin private key-----")
    ) {
      throw new Error(
        `[Security Violation] Attempted to store raw API credential in client storage for key "${key}".`
      );
    }
  }
}
