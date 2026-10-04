/*
  # Create disciplinary cards table

  1. New Tables
    - `cards`
      - `id` (uuid, primary key)
      - `match_id` (uuid, foreign key to matches, ON DELETE CASCADE)
      - `timestamp` (timestamptz) - When the card was issued
      - `card_color` (text) - 'yellow', 'red', or 'black'
      - `side` (text) - Which side: 'left' or 'right'
      - `player_name` (text) - Name of the player receiving the card
      - `reason` (text) - Reason for the card

  2. Security
    - RLS enabled on `cards` with full anon+authenticated CRUD (public scoreboard app)
*/

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  card_color text NOT NULL DEFAULT 'yellow',
  side text NOT NULL DEFAULT 'left',
  player_name text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT ''
);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cards" ON cards;
CREATE POLICY "anon_select_cards" ON cards
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cards" ON cards;
CREATE POLICY "anon_insert_cards" ON cards
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cards" ON cards;
CREATE POLICY "anon_update_cards" ON cards
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cards" ON cards;
CREATE POLICY "anon_delete_cards" ON cards
  FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_cards_match_id ON cards(match_id);
