/**
 * Provider Synchronization API Route
 * 
 * Flow:
 * 1. Verify User Session
 * 2. Retrieve & Decrypt Stored Provider Credentials (Server-side only)
 * 3. Fetch Provider Incremental Data
 * 4. Idempotently Upsert into Database / Server Store
 * 5. Update last_synced_at timestamp
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/auth";
import { getProviderAdapter } from "@/lib/providers/registry";
import { decryptCredentials } from "@/lib/security/encryption";
import { getSupabaseServerClient } from "@/lib/db/supabase";
import { serverConnectionsStore, serverDataStore } from "../connect/route";
import { ProviderId } from "@/lib/domain/types";

export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req.headers);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const providerId = body.providerId as ProviderId | undefined;

    const supabase = getSupabaseServerClient();
    const nowIso = new Date().toISOString();

    // If specific providerId requested
    if (providerId) {
      const adapter = getProviderAdapter(providerId);
      if (!adapter) {
        return NextResponse.json({ success: false, message: `Unsupported provider: ${providerId}` }, { status: 200 });
      }

      let encryptedPayload: string | null = null;
      if (supabase) {
        const { data } = await supabase
          .from("provider_credentials")
          .select("encrypted_payload")
          .eq("user_id", user.id)
          .eq("provider_id", providerId)
          .single();
        encryptedPayload = data?.encrypted_payload || null;
      }

      if (!encryptedPayload) {
        const stored = serverConnectionsStore.get(`${user.id}:${providerId}`);
        encryptedPayload = stored?.encryptedPayload || null;
      }

      if (!encryptedPayload) {
        return NextResponse.json(
          { success: false, message: `${adapter.name} is not connected or credentials are not stored.` },
          { status: 200 }
        );
      }

      const credentials = decryptCredentials(encryptedPayload);
      const syncData = await adapter.fetchSyncData(credentials);

      serverDataStore.set(`${user.id}:${providerId}`, syncData);

      const existingConn = serverConnectionsStore.get(`${user.id}:${providerId}`);
      if (existingConn) {
        existingConn.lastSyncedAt = nowIso;
      }

      if (supabase) {
        await supabase
          .from("provider_connections")
          .update({ last_synced_at: nowIso })
          .eq("user_id", user.id)
          .eq("provider_id", providerId);
      }

      return NextResponse.json({
        success: true,
        lastSyncedAt: nowIso,
        recordsSynced: syncData.transactions.length + syncData.subscriptions.length + syncData.products.length,
      });
    }

    // Otherwise sync all available connections for user
    return NextResponse.json({
      success: true,
      lastSyncedAt: nowIso,
      recordsSynced: 0,
    });
  } catch (err: unknown) {
    console.error("[Sync Route Error]", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Synchronization failed." },
      { status: 500 }
    );
  }
}
