/*
  # Create crypto transfers table

  1. New Tables
    - `crypto_transfers`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, references transactions, required)
      - `sender_id` (uuid, references user_profiles, required)
      - `recipient_id` (uuid, references user_profiles, optional)
      - `recipient_address` (text, optional)
      - `crypto_symbol` (text, required)
      - `amount` (decimal, required)
      - `network_fee` (decimal, default 0)
      - `transfer_type` (text, required)
      - `status` (text, default 'pending')
      - `memo` (text, optional)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `crypto_transfers` table
    - Add policies for senders and recipients
*/

-- Create crypto transfers table
CREATE TABLE IF NOT EXISTS crypto_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES user_profiles(id),
  recipient_address text,
  crypto_symbol text NOT NULL,
  amount decimal(20,8) NOT NULL,
  network_fee decimal(20,8) DEFAULT 0,
  transfer_type text NOT NULL CHECK (transfer_type IN ('internal', 'external')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  memo text,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (transfer_type = 'internal' AND recipient_id IS NOT NULL AND recipient_address IS NULL) OR
    (transfer_type = 'external' AND recipient_id IS NULL AND recipient_address IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE crypto_transfers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage transfers they sent"
  ON crypto_transfers
  FOR ALL
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view transfers they received"
  ON crypto_transfers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crypto_transfers_sender_id ON crypto_transfers(sender_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transfers_recipient_id ON crypto_transfers(recipient_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transfers_transaction_id ON crypto_transfers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transfers_created_at ON crypto_transfers(created_at DESC);