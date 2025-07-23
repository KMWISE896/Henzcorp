/*
  # Create crypto trades table

  1. New Tables
    - `crypto_trades`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, references transactions, required)
      - `user_id` (uuid, references user_profiles, required)
      - `trade_type` (text, required)
      - `crypto_symbol` (text, required)
      - `crypto_amount` (decimal, required)
      - `fiat_amount` (decimal, required)
      - `fiat_currency` (text, default 'UGX')
      - `price_per_unit` (decimal, required)
      - `status` (text, default 'pending')
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `crypto_trades` table
    - Add policy for users to manage their own trades
*/

-- Create crypto trades table
CREATE TABLE IF NOT EXISTS crypto_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  trade_type text NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  crypto_symbol text NOT NULL,
  crypto_amount decimal(20,8) NOT NULL,
  fiat_amount decimal(20,2) NOT NULL,
  fiat_currency text DEFAULT 'UGX',
  price_per_unit decimal(20,8) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE crypto_trades ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own crypto trades"
  ON crypto_trades
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crypto_trades_user_id ON crypto_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_trades_transaction_id ON crypto_trades(transaction_id);
CREATE INDEX IF NOT EXISTS idx_crypto_trades_symbol ON crypto_trades(crypto_symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_trades_created_at ON crypto_trades(created_at DESC);