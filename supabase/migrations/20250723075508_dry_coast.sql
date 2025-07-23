/*
  # Create airtime purchases table

  1. New Tables
    - `airtime_purchases`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, references transactions, required)
      - `user_id` (uuid, references user_profiles, required)
      - `phone_number` (text, required)
      - `network` (text, required)
      - `amount` (decimal, required)
      - `recipient_type` (text, required)
      - `status` (text, default 'pending')
      - `external_reference` (text, optional)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `airtime_purchases` table
    - Add policy for users to manage their own purchases
*/

-- Create airtime purchases table
CREATE TABLE IF NOT EXISTS airtime_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  network text NOT NULL CHECK (network IN ('mtn', 'airtel', 'utl')),
  amount decimal(10,2) NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('self', 'other')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  external_reference text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE airtime_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own airtime purchases"
  ON airtime_purchases
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_airtime_purchases_user_id ON airtime_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_airtime_purchases_transaction_id ON airtime_purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_airtime_purchases_network ON airtime_purchases(network);
CREATE INDEX IF NOT EXISTS idx_airtime_purchases_created_at ON airtime_purchases(created_at DESC);