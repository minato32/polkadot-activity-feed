-- 001_initial_schema.sql
-- Polkadot Activity Feed — Events table with TimescaleDB

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Events table — unified schema for all chain events
CREATE TABLE IF NOT EXISTS events (
  id            BIGSERIAL       NOT NULL,
  chain_id      TEXT            NOT NULL,
  block_number  BIGINT          NOT NULL,
  timestamp     TIMESTAMPTZ     NOT NULL,
  event_type    TEXT            NOT NULL,
  pallet        TEXT            NOT NULL,
  method        TEXT            NOT NULL,
  accounts      TEXT[]          NOT NULL DEFAULT '{}',
  data          JSONB           NOT NULL DEFAULT '{}',
  significance  SMALLINT        NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  -- Composite primary key required by TimescaleDB hypertable
  PRIMARY KEY (id, timestamp)
);

-- Convert to TimescaleDB hypertable partitioned by timestamp
-- Chunk interval: 1 day (tunable based on ingestion volume)
SELECT create_hypertable('events', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Indexes for common query patterns
CREATE INDEX idx_events_type_time ON events (event_type, timestamp DESC);
CREATE INDEX idx_events_chain_time ON events (chain_id, timestamp DESC);
CREATE INDEX idx_events_accounts ON events USING GIN (accounts);
CREATE INDEX idx_events_significance ON events (significance, timestamp DESC);

-- Composite index for filtered feed queries (chain + type + time)
CREATE INDEX idx_events_chain_type_time ON events (chain_id, event_type, timestamp DESC);
