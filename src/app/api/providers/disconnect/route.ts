/**
 * Provider Disconnect API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/auth";
import { getSupabaseServerClient } from "@/lib/db/supabase";
import { serverConnectionsStore } from "../connect/route";
import { ProviderId } from "@/lib/domain/types";

export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req.headers);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const providerId = body.providerId as ProviderId;

    if (!providerId) {
      return NextResponse.json({ error: "Missing providerId." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      // 1. Delete encrypted credentials
      await supabase
        .from("provider_credentials")
        .delete()
        .eq("user_id", user.id)
        .eq("provider_id", providerId);

      // 2. Mark connection as disconnected
      await supabase
        .from("provider_connections")
        .update({ status: "disconnected" })
        .eq("user_id", user.id)
        .eq("provider_id", providerId);
    }

    serverConnectionsStore.delete(`${user.id}:${providerId}`);

    return NextResponse.json({
      success: true,
      message: "Disconnected. Historical normalized business data remains available.",
    });
  } catch (err: unknown) {
    console.error("[Disconnect Route Error]", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to disconnect provider." },
      { status: 500 }
    );
  }
}
