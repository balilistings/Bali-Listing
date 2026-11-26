BEGIN;

CREATE TABLE IF NOT EXISTS account_passwords (
  account_id uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  password_hash text NOT NULL
);
CREATE TABLE IF NOT EXISTS account_sessions (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS account_sessions_owner ON account_sessions (account_id);
CREATE TABLE IF NOT EXISTS account_email_tokens (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  email text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('signup', 'recovery')),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS account_email_tokens_owner ON account_email_tokens (account_id);
CREATE TABLE IF NOT EXISTS marketplace_oauth_states (
  state_hash text PRIMARY KEY,
  browser_hash text NOT NULL,
  verifier text NOT NULL,
  nonce text NOT NULL,
  new_role text CHECK (new_role IN ('customer', 'provider')),
  next_path text NOT NULL,
  expires_at timestamptz NOT NULL
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS request_key uuid;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bedrooms integer;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_period text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS prices jsonb NOT NULL DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS reference_code text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS legacy_reference text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE listings ADD COLUMN IF NOT EXISTS editor_private_data jsonb NOT NULL DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sharetribe_source_hash text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sharetribe_synced_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS source_price_minor bigint;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS source_price_currency text;
CREATE UNIQUE INDEX IF NOT EXISTS listing_request_per_owner ON listings (owner_id, request_key);
CREATE UNIQUE INDEX IF NOT EXISTS listing_reference_unique ON listings (reference_code);
CREATE INDEX IF NOT EXISTS published_listing_catalog ON listings (category, area, created_at DESC)
  WHERE state = 'published' AND NOT is_pilot_fixture;

CREATE TABLE IF NOT EXISTS marketplace_reference_registry (
  code text PRIMARY KEY
);
CREATE SEQUENCE IF NOT EXISTS marketplace_reference_number;
CREATE TABLE IF NOT EXISTS marketplace_listing_photos (
  id uuid PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  position integer NOT NULL,
  UNIQUE (listing_id, position)
);
ALTER TABLE marketplace_listing_photos DROP CONSTRAINT IF EXISTS marketplace_listing_photos_position_check;
ALTER TABLE marketplace_listing_photos ADD CONSTRAINT marketplace_listing_photos_position_check
  CHECK (position BETWEEN 0 AND 99);
ALTER TABLE marketplace_listing_photos ADD COLUMN IF NOT EXISTS source_url_hash text;

CREATE TABLE IF NOT EXISTS listing_import_pilot (
  run_name text PRIMARY KEY,
  listing_ids uuid[] NOT NULL
);

-- The pilot already fetched and verified the image in R2 and mapped its actual author.
WITH snapshot_rows AS (
  INSERT INTO listings (id, owner_id, slug, title, description, state, price_amount, currency,
    created_at, category, area, bedrooms, price_period, prices)
  SELECT id, owner_id, id::text, title, description, 'published', yearly_rent_idr, 'IDR',
    created_on::timestamp AT TIME ZONE 'Asia/Makassar', 'rental', area, bedrooms, 'yearly',
    jsonb_build_object('yearly', yearly_rent_idr)
  FROM pilot_listing_snapshots WHERE owner_id IS NOT NULL
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
INSERT INTO marketplace_listing_photos (id, listing_id, object_key, content_type, position)
SELECT snapshot.id, snapshot.id, snapshot.cover_key, snapshot.cover_content_type, 0
FROM pilot_listing_snapshots AS snapshot JOIN snapshot_rows USING (id);

COMMIT;
