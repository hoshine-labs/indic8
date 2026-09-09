/**
 * Provider Connection API Route
 * 
 * Flow:
 * 1. Verify User Session
 * 2. Validate Credentials directly with Provider API
 * 3. Encrypt Validated Credentials (AES-256-GCM)
 * 4. Persist to PostgreSQL (Supabase)
 * 5. Run Real Initial Sync & Normalization
 * 6. Return Connection Metadata (Zero credentials returned)
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/auth";
import { getProviderAdapter } from "@/lib/providers/registry";
import { encryptCredentials } from "@/lib/security/encryption";
import { getSupabaseServerClient } from "@/lib/db/supabase";
import { ProviderId } from "@/lib/domain/types";
import { ProviderSyncPayload } from "@/lib/providers/types";

// Server-side in-memory store fallback for development environments without Supabase env vars
export const serverConnectionsStore = new Map<string, any>();
export const serverDataStore = new Map<string, ProviderSyncPayload>();

export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req.headers);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const providerId = body.providerId as ProviderId;
    const credentials = (body.credentials || {}) as Record<string, string>;

    if (!providerId) {
      return NextResponse.json({ error: "Missing providerId." }, { status: 400 });
    }

    const adapter = getProviderAdapter(providerId);
    if (!adapter) {
      return NextResponse.json({ error: `Unsupported provider: ${providerId}` }, { status: 400 });
    }

    // 1. Validate credentials with the real Provider API
    const validation = await adapter.validateConnection(credentials);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errorMessage || `Unable to connect to ${adapter.name}. Provider rejected credentials.`,
        },
        { status: 400 }
      );
    }

    // 2. Encrypt credentials
    const encryptedPayload = encryptCredentials(credentials);

    const connectionId = `conn_${providerId}_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const connectionRecord = {
      id: connectionId,
      userId: user.id,
      providerId: providerId,
      accountName: validation.accountName || credentials.accountName || `${adapter.name} Primary`,
      accountId: validation.accountId,
      status: "connected" as const,
      capabilities: validation.capabilities,
      isSandbox: Boolean(credentials.isSandbox),
      connectedAt: nowIso,
      lastSyncedAt: nowIso,
    };

    // 3. Persist to Supabase if configured, otherwise memory store
    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase.from("provider_connections").upsert({
        id: connectionId,
        user_id: user.id,
        provider_id: providerId,
        account_name: connectionRecord.accountName,
        external_account_id: connectionRecord.accountId,
        status: "connected",
        capabilities: validation.capabilities,
        is_sandbox: connectionRecord.isSandbox,
        connected_at: nowIso,
        last_synced_at: nowIso,
      });

      await supabase.from("provider_credentials").upsert({
        id: `cred_${connectionId}`,
        connection_id: connectionId,
        user_id: user.id,
        encrypted_payload: encryptedPayload,
        key_version: "v1",
      });
    }

    serverConnectionsStore.set(`${user.id}:${providerId}`, {
      ...connectionRecord,
      encryptedPayload,
    });

    // 4. Initial Sync
    let syncPayload: ProviderSyncPayload = { products: [], transactions: [], subscriptions: [], customers: [] };
    try {
      syncPayload = await adapter.fetchSyncData(credentials);
    } catch (syncErr) {
      console.warn(`[Sync Warning] Initial sync for ${providerId} completed with warnings:`, syncErr);
    }

    serverDataStore.set(`${user.id}:${providerId}`, syncPayload);

    // 5. Return sanitized connection object (NO secrets)
    return NextResponse.json({
      success: true,
      connection: connectionRecord,
      recordsSynced: syncPayload.transactions.length + syncPayload.subscriptions.length,
    });
  } catch (err: unknown) {
    console.error("[Connect Route Error]", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal server error connecting provider." },
      { status: 500 }
    );
  }
}
