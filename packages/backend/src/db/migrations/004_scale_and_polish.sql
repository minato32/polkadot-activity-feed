-- Migration 004: Scale and Polish — API keys, webhooks, and search index

-- ─── API Keys ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key              TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  tier             TEXT NOT NULL DEFAULT 'pro',
  requests_today   INT  NOT NULL DEFAULT 0,
  requests_limit   INT  NOT NULL DEFAULT 1000,
  last_reset_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key     ON api_keys(key);

-- ─── Webhook Configs ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_configs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  secret     TEXT NOT NULL,
  preset_id  UUID REFERENCES filter_presets(id) ON DELETE SET NULL,
  enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_configs_user_id ON webhook_configs(user_id);

-- ─── Webhook Deliveries ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id  UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
  event_id           BIGINT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending',
  attempts           INT  NOT NULL DEFAULT 0,
  last_attempt_at    TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_config_id ON webhook_deliveries(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status    ON webhook_deliveries(status);

-- ─── Full-Text Search Index on Events ────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_events_search
  ON events
  USING GIN (
    to_tsvector(
      'english',
      coalesce(pallet, '') || ' ' ||
      coalesce(method, '') || ' ' ||
      coalesce(event_type, '')
    )
  );
