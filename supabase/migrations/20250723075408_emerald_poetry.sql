/*
  # Create wallets table

  1. New Tables
    - `wallets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles, required)
      - `currency` (text, required)
      - `balance` (decimal, default 0)
      - `available_balance` (decimal, default 0)
      - `locked_balance` (decimal, default 0)
      - `wallet_address` (text, optional)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `wallets` table
    - Add policy for users to manage their own wallets

  3. Constraints
    - Unique constraint on (user_id, currency)
    - Check constraints for balance validation
*/

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  currency text NOT NULL,
  balance decimal(20,8) DEFAULT 0,
  available_balance decimal(20,8) DEFAULT 0,
  locked_balance decimal(20,8) DEFAULT 0,
  wallet_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, currency),
  CHECK (balance >= 0),
  CHECK (available_balance >= 0),
  CHECK (locked_balance >= 0),
  CHECK (balance = available_balance + locked_balance)
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own wallets"
  ON wallets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER on_wallet_updated
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON wallets(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Create function to get user balance
CREATE OR REPLACE FUNCTION get_user_balance(user_uuid uuid, wallet_currency text)
RETURNS decimal AS $$
DECLARE
  balance_amount decimal;
BEGIN
  SELECT COALESCE(available_balance, 0) INTO balance_amount
  FROM wallets
  WHERE user_id = user_uuid AND currency = wallet_currency;
  
  RETURN COALESCE(balance_amount, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance(
  user_uuid uuid,
  wallet_currency text,
  amount_change decimal,
  operation_type text DEFAULT 'add'
)
RETURNS boolean AS $$
DECLARE
  current_balance decimal;
  new_balance decimal;
BEGIN
  -- Get current balance
  SELECT available_balance INTO current_balance
  FROM wallets
  WHERE user_id = user_uuid AND currency = wallet_currency;
  
  -- If wallet doesn't exist, create it
  IF current_balance IS NULL THEN
    INSERT INTO wallets (user_id, currency, balance, available_balance, locked_balance)
    VALUES (user_uuid, wallet_currency, 0, 0, 0);
    current_balance := 0;
  END IF;
  
  -- Calculate new balance
  IF operation_type = 'add' THEN
    new_balance := current_balance + amount_change;
  ELSE
    new_balance := current_balance - amount_change;
  END IF;
  
  -- Check for negative balance
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', current_balance, amount_change;
  END IF;
  
  -- Update wallet
  UPDATE wallets
  SET 
    available_balance = new_balance,
    balance = new_balance + locked_balance,
    updated_at = now()
  WHERE user_id = user_uuid AND currency = wallet_currency;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;