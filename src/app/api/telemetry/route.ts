/**
 * Telemetry Consolidated API Route
 * 
 * Fetches the user's authentic synchronized business records.
 */

import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth/auth";
import { getSupabaseServerClient } from "@/lib/db/supabase";
import { serverConnectionsStore, serverDataStore } from "../providers/connect/route";

export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req.headers);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const [connRes, prodRes, txRes, subsRes, custRes] = await Promise.all([
        supabase.from("provider_connections").select("*").eq("user_id", user.id).eq("status", "connected"),
        supabase.from("products").select("*, product_channels(*)").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(250),
        supabase.from("subscriptions").select("*").eq("user_id", user.id),
        supabase.from("customers").select("*").eq("user_id", user.id),
      ]);

      return NextResponse.json({
        connections: connRes.data || [],
        products: prodRes.data || [],
        transactions: txRes.data || [],
        subscriptions: subsRes.data || [],
        customers: custRes.data || [],
      });
    }

    // Return in-memory stored connections & data for development
    const connections: any[] = [];
    let products: any[] = [];
    let transactions: any[] = [];
    let subscriptions: any[] = [];
    let customers: any[] = [];

    serverConnectionsStore.forEach((conn, key) => {
      if (key.startsWith(`${user.id}:`)) {
        const { encryptedPayload, ...sanitized } = conn;
        connections.push(sanitized);
      }
    });

    serverDataStore.forEach((data, key) => {
      if (key.startsWith(`${user.id}:`)) {
        products = products.concat(data.products || []);
        transactions = transactions.concat(data.transactions || []);
        subscriptions = subscriptions.concat(data.subscriptions || []);
        customers = customers.concat(data.customers || []);
      }
    });

    return NextResponse.json({
      connections,
      products,
      transactions,
      subscriptions,
      customers,
    });
  } catch (err: unknown) {
    console.error("[Telemetry Route Error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch telemetry data." },
      { status: 500 }
    );
  }
}
