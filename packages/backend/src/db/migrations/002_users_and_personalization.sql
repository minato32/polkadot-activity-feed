-- 002_users_and_personalization.sql
-- Polkadot Activity Feed — User accounts and personalization tables

-- Users — identified by their SS58 wallet address
CREATE TABLE IF NOT EXISTS users (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address      TEXT        NOT NULL UNIQUE,
  display_name TEXT,
  tier         TEXT        NOT NULL DEFAULT 'free',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wallets the user is following
CREATE TABLE IF NOT EXISTS followed_wallets (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  address    TEXT        NOT NULL,
  label      TEXT,
  chain_id   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, address)
);

CREATE INDEX IF NOT EXISTS idx_followed_wallets_user_id ON followed_wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_followed_wallets_address  ON followed_wallets (address);

-- Saved filter presets
CREATE TABLE IF NOT EXISTS filter_presets (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  filters    JSONB       NOT NULL DEFAULT '{}',
  is_default BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filter_presets_user_id ON filter_presets (user_id);

-- Notification delivery configs
CREATE TABLE IF NOT EXISTS notification_configs (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  channel    TEXT        NOT NULL,
  preset_id  UUID        NOT NULL REFERENCES filter_presets (id) ON DELETE CASCADE,
  config     JSONB       NOT NULL DEFAULT '{}',
  enabled    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_configs_user_id ON notification_configs (user_id);
