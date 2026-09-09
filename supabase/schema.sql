-- ==============================================================================
-- indic8 — Production Supabase PostgreSQL Schema
-- ==============================================================================

-- 1. BETTER AUTH TABLES
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "scope" TEXT,
  "idToken" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_session_user" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "idx_account_user" ON "account"("userId");
CREATE INDEX IF NOT EXISTS "idx_account_provider" ON "account"("providerId", "accountId");

-- ==============================================================================
-- 2. PROVIDER CONNECTIONS & ENCRYPTED CREDENTIALS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS "provider_connections" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "provider_id" TEXT NOT NULL, -- stripe, polar, revenuecat, app_store, google_play, lemonsqueezy
  "account_name" TEXT NOT NULL,
  "external_account_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'connected', -- connected, sync_failed, disconnected, expired
  "capabilities" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "is_sandbox" BOOLEAN NOT NULL DEFAULT FALSE,
  "connected_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "last_synced_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "uq_user_provider_account" UNIQUE ("user_id", "provider_id", "external_account_id")
);

CREATE INDEX IF NOT EXISTS "idx_provider_conn_user" ON "provider_connections"("user_id");
CREATE INDEX IF NOT EXISTS "idx_provider_conn_status" ON "provider_connections"("user_id", "status");

CREATE TABLE IF NOT EXISTS "provider_credentials" (
  "id" TEXT PRIMARY KEY,
  "connection_id" TEXT NOT NULL UNIQUE REFERENCES "provider_connections"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "encrypted_payload" TEXT NOT NULL, -- AES-256-GCM ciphertext format: v1:iv:authTag:encrypted
  "key_version" TEXT NOT NULL DEFAULT 'v1',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_credentials_user" ON "provider_credentials"("user_id");

-- ==============================================================================
-- 3. CANONICAL NORMALIZED BUSINESS DATA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS "products" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active', -- active, archived
  "category" TEXT NOT NULL DEFAULT 'saas',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_products_user" ON "products"("user_id");

CREATE TABLE IF NOT EXISTS "product_channels" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "product_id" TEXT REFERENCES "products"("id") ON DELETE SET NULL,
  "provider_id" TEXT NOT NULL,
  "external_product_id" TEXT NOT NULL,
  "external_product_name" TEXT NOT NULL,
  "external_sku" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "uq_channel_provider_external" UNIQUE ("user_id", "provider_id", "external_product_id")
);

CREATE INDEX IF NOT EXISTS "idx_channels_user_product" ON "product_channels"("user_id", "product_id");

CREATE TABLE IF NOT EXISTS "customers" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "provider_id" TEXT NOT NULL,
  "external_customer_id" TEXT NOT NULL,
  "email" TEXT,
  "name" TEXT,
  "country" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "uq_customer_provider_external" UNIQUE ("user_id", "provider_id", "external_customer_id")
);

CREATE INDEX IF NOT EXISTS "idx_customers_user" ON "customers"("user_id");

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "connection_id" TEXT NOT NULL REFERENCES "provider_connections"("id") ON DELETE CASCADE,
  "provider_id" TEXT NOT NULL,
  "external_transaction_id" TEXT NOT NULL,
  "product_id" TEXT REFERENCES "products"("id") ON DELETE SET NULL,
  "channel_id" TEXT REFERENCES "product_channels"("id") ON DELETE SET NULL,
  "customer_id" TEXT REFERENCES "customers"("id") ON DELETE SET NULL,
  "amount_cents" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "fee_cents" BIGINT NOT NULL DEFAULT 0,
  "net_cents" BIGINT NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'succeeded', -- succeeded, pending, refunded, failed
  "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "uq_transaction_provider_external" UNIQUE ("user_id", "provider_id", "external_transaction_id")
);

CREATE INDEX IF NOT EXISTS "idx_transactions_user_occurred" ON "transactions"("user_id", "occurred_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_transactions_product" ON "transactions"("user_id", "product_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_provider" ON "transactions"("user_id", "provider_id");

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "connection_id" TEXT NOT NULL REFERENCES "provider_connections"("id") ON DELETE CASCADE,
  "provider_id" TEXT NOT NULL,
  "external_subscription_id" TEXT NOT NULL,
  "product_id" TEXT REFERENCES "products"("id") ON DELETE SET NULL,
  "customer_id" TEXT REFERENCES "customers"("id") ON DELETE SET NULL,
  "mrr_cents" BIGINT NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'active', -- active, trialing, past_due, canceled, paused
  "interval" TEXT NOT NULL DEFAULT 'month', -- month, year, week, day
  "current_period_start" TIMESTAMP WITH TIME ZONE,
  "current_period_end" TIMESTAMP WITH TIME ZONE,
  "started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "canceled_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "uq_subscription_provider_external" UNIQUE ("user_id", "provider_id", "external_subscription_id")
);

CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_status" ON "subscriptions"("user_id", "status");

CREATE TABLE IF NOT EXISTS "refunds" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "connection_id" TEXT NOT NULL REFERENCES "provider_connections"("id") ON DELETE CASCADE,
  "provider_id" TEXT NOT NULL,
  "external_refund_id" TEXT NOT NULL,
  "transaction_id" TEXT REFERENCES "transactions"("id") ON DELETE SET NULL,
  "amount_cents" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "reason" TEXT,
  "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "uq_refund_provider_external" UNIQUE ("user_id", "provider_id", "external_refund_id")
);

CREATE INDEX IF NOT EXISTS "idx_refunds_user_occurred" ON "refunds"("user_id", "occurred_at" DESC);

-- ==============================================================================
-- 4. SYNC RUNS & AUDIT LOGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS "sync_runs" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "connection_id" TEXT NOT NULL REFERENCES "provider_connections"("id") ON DELETE CASCADE,
  "provider_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'processing', -- processing, complete, failed
  "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "finished_at" TIMESTAMP WITH TIME ZONE,
  "records_synced" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_sync_runs_user" ON "sync_runs"("user_id", "started_at" DESC);

CREATE TABLE IF NOT EXISTS "milestones" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "numeric_value" NUMERIC NOT NULL,
  "metric_label" TEXT NOT NULL,
  "subtext" TEXT,
  "verified_source" TEXT NOT NULL,
  "achieved_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "is_shared" BOOLEAN NOT NULL DEFAULT FALSE,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_milestones_user_achieved" ON "milestones"("user_id", "achieved_at" DESC);

CREATE TABLE IF NOT EXISTS "gallery_posts" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "aspect_ratio" TEXT NOT NULL DEFAULT '16:9',
  "template_style" TEXT NOT NULL DEFAULT 'keynote',
  "verified_source" TEXT NOT NULL,
  "configuration" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "storage_path" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_gallery_user" ON "gallery_posts"("user_id", "created_at" DESC);
