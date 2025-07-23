/*
  # Create crypto assets table

  1. New Tables
    - `crypto_assets`
      - `id` (uuid, primary key)
      - `symbol` (text, unique, required)
      - `name` (text, required)
      - `current_price_ugx` (decimal, required)
      - `market_cap` (decimal, default 0)
      - `volume_24h` (decimal, default 0)
      - `price_change_24h` (decimal, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `crypto_assets` table
    - Add policy for public read access

  3. Sample Data
    - Insert popular cryptocurrencies with UGX prices
*/

-- Create crypto assets table
CREATE TABLE IF NOT EXISTS crypto_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text UNIQUE NOT NULL,
  name text NOT NULL,
  current_price_ugx decimal(20,8) NOT NULL DEFAULT 0,
  market_cap decimal(20,2) DEFAULT 0,
  volume_24h decimal(20,2) DEFAULT 0,
  price_change_24h decimal(10,4) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE crypto_assets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read crypto assets"
  ON crypto_assets
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Only admins can modify crypto assets"
  ON crypto_assets
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Create trigger for updated_at
CREATE TRIGGER on_crypto_asset_updated
  BEFORE UPDATE ON crypto_assets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crypto_assets_symbol ON crypto_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_assets_active ON crypto_assets(is_active);

-- Insert sample crypto assets with UGX prices
INSERT INTO crypto_assets (symbol, name, current_price_ugx, market_cap, volume_24h, price_change_24h, is_active) VALUES
('BTC', 'Bitcoin', 165420000, 3200000000000, 890000000000, 2.45, true),
('ETH', 'Ethereum', 8750000, 1100000000000, 420000000000, 1.82, true),
('USDT', 'Tether', 3700, 340000000000, 1200000000000, 0.01, true),
('LTC', 'Litecoin', 380000, 110000000000, 45000000000, -0.75, true)
ON CONFLICT (symbol) DO UPDATE SET
  current_price_ugx = EXCLUDED.current_price_ugx,
  market_cap = EXCLUDED.market_cap,
  volume_24h = EXCLUDED.volume_24h,
  price_change_24h = EXCLUDED.price_change_24h,
  updated_at = now();