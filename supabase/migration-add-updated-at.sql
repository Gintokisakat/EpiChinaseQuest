ALTER TABLE user_cards ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
