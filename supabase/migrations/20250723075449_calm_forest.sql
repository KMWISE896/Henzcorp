/*
  # Create withdrawals table

  1. New Tables
    - `withdrawals`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, references transactions, required)
      - `user_id` (uuid, references user_profiles, required)
      - `withdrawal_method` (text, required)
      - `amount` (decimal, required)
      - `currency` (text, required)
      - `destination_details` (jsonb, required)
      - `status` (text, default 'pending')
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `withdrawals` table
    - Add policy for users to manage their own withdrawals
*/

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  withdrawal_method text NOT NULL CHECK (withdrawal_method IN ('mtn_money', 'airtel_money', 'bank_transfer')),
  amount decimal(20,8) NOT NULL,
  currency text NOT NULL,
  destination_details jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own withdrawals"
  ON withdrawals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_transaction_id ON withdrawals(transaction_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);