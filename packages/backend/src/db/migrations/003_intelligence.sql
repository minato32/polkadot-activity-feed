-- Migration 003: Intelligence tables
-- whale labels, XCM correlations, event aggregations, digest configs/entries

-- Whale / notable address labels
CREATE TABLE IF NOT EXISTS whale_labels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address     TEXT NOT NULL,
  label       TEXT NOT NULL,
  category    TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'community',
  verified    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (address)
);

-- XCM cross-chain message correlations
CREATE TABLE IF NOT EXISTS xcm_correlations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_chain_id  TEXT NOT NULL,
  source_event_id  BIGINT NOT NULL,
  dest_chain_id    TEXT NOT NULL,
  dest_event_id    BIGINT,
  message_hash     TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS xcm_correlations_message_hash_idx ON xcm_correlations (message_hash);
CREATE INDEX IF NOT EXISTS xcm_correlations_status_idx       ON xcm_correlations (status);

-- Event aggregation clusters
CREATE TABLE IF NOT EXISTS event_aggregations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type        TEXT NOT NULL,
  chain_id          TEXT,
  time_window_start TIMESTAMPTZ NOT NULL,
  time_window_end   TIMESTAMPTZ NOT NULL,
  event_count       INT NOT NULL,
  summary           TEXT NOT NULL,
  significance      SMALLINT NOT NULL DEFAULT 0,
  event_ids         BIGINT[] NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User digest configurations (one config per user)
CREATE TABLE IF NOT EXISTS digest_configs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  frequency        TEXT NOT NULL DEFAULT 'daily',
  email            TEXT,
  telegram_chat_id TEXT,
  enabled          BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Generated digest entries
CREATE TABLE IF NOT EXISTS digest_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_config_id UUID NOT NULL REFERENCES digest_configs (id) ON DELETE CASCADE,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at     TIMESTAMPTZ,
  event_count      INT NOT NULL DEFAULT 0,
  top_events       JSONB NOT NULL DEFAULT '[]'
);
