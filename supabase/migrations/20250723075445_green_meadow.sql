/*
  # Create deposits table

  1. New Tables
    - `deposits`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, references transactions, required)
      - `user_id` (uuid, references user_profiles, required)
      - `payment_method` (text, required)
      - `amount` (decimal, required)
      - `currency` (text, required)
      - `external_reference` (text, optional)
      - `status` (text, default 'pending')
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `deposits` table
    - Add policy for users to manage their own deposits
*/

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  payment_method text NOT NULL CHECK (payment_method IN ('mtn_money', 'airtel_money', 'bank_transfer')),
  amount decimal(20,8) NOT NULL,
  currency text NOT NULL,
  external_reference text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own deposits"
  ON deposits
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_transaction_id ON deposits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at DESC);