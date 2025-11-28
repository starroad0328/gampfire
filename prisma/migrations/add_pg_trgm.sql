-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN index on title for fast trigram search
CREATE INDEX IF NOT EXISTS game_title_trgm_idx ON "Game" USING gin (title gin_trgm_ops);
