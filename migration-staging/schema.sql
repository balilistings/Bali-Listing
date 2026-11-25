BEGIN;

CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'provider')),
  status text NOT NULL CHECK (status IN ('active', 'restricted', 'deleted')),
  email text,
  email_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES accounts (id),
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  state text NOT NULL CHECK (state IN ('draft', 'pendingApproval', 'published', 'closed')),
  price_amount bigint CHECK (price_amount >= 0),
  currency text CHECK (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz NOT NULL,
  availability_confirmed_at timestamptz,
  public_data jsonb NOT NULL DEFAULT '{}',
  is_pilot_fixture boolean NOT NULL DEFAULT false,
  CHECK ((price_amount IS NULL) = (currency IS NULL))
);

INSERT INTO accounts (id, display_name, role, status, created_at)
VALUES ('3db8044b-c18f-48bd-a04d-d6f08183be04', 'Sample provider', 'provider', 'active', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO listings (id, owner_id, slug, title, description, state, price_amount, currency, created_at, is_pilot_fixture)
VALUES (
  '53ebcfc5-dc23-466b-b6c7-ce37a57f9fe2',
  '3db8044b-c18f-48bd-a04d-d6f08183be04',
  'sample-rental',
  'Sample rental',
  'Synthetic listing for testing the Render migration.',
  'published',
  2800000000,
  'IDR',
  now(),
  true
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS pilot_listing_snapshots (
  id uuid PRIMARY KEY,
  created_on date NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  yearly_rent_idr bigint NOT NULL CHECK (yearly_rent_idr > 0),
  bedrooms int NOT NULL CHECK (bedrooms > 0),
  area text NOT NULL,
  source_url text NOT NULL,
  cover_source_hash text NOT NULL,
  cover_key text NOT NULL,
  cover_content_type text NOT NULL,
  cover_sha256 text NOT NULL
);

COMMIT;
