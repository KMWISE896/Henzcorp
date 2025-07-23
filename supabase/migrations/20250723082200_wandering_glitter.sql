/*
  # Complete HenzCorp Database Setup
  
  This migration sets up the entire database schema for the HenzCorp cryptocurrency app.
  It includes all tables, security policies, functions, and sample data.
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS referral_earnings CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS airtime_purchases CASCADE;
DROP TABLE IF EXISTS crypto_transfers CASCADE;
DROP TABLE IF EXISTS crypto_trades CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS crypto_assets CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_referral_stats(uuid);
DROP FUNCTION IF EXISTS update_wallet_balance(uuid, text, decimal, text);
DROP FUNCTION IF EXISTS get_user_balance(uuid, text);
DROP FUNCTION IF EXISTS generate_transaction_reference();
DROP FUNCTION IF EXISTS generate_referral_code();
DROP FUNCTION IF EXISTS handle_new_user_signup();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_new_transaction();
DROP FUNCTION IF EXISTS handle_updated_at();
DROP FUNCTION IF EXISTS handle_user_delete();

-- Create utility functions first
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := 'HENZ' || EXTRACT(YEAR FROM NOW()) || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM user_profiles WHERE referral_code = code) INTO exists;
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_transaction_reference()
RETURNS text AS $$
DECLARE
  ref text;
  exists boolean;
BEGIN
  LOOP
    ref := 'TXN' || TO_CHAR(NOW(), 'YYYYMMDD') || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM transactions WHERE reference_id = ref) INTO exists;
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  profile_image_url text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read profiles for referrals" ON user_profiles
  FOR SELECT TO authenticated USING (true);

-- 2. Create wallets table
CREATE TABLE wallets (
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
  CHECK (locked_balance >= 0)
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wallets" ON wallets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Create crypto_assets table
CREATE TABLE crypto_assets (
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

ALTER TABLE crypto_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read crypto assets" ON crypto_assets
  FOR SELECT TO authenticated USING (is_active = true);

-- 4. Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'buy_crypto', 'sell_crypto', 'airtime_purchase')),
  currency text NOT NULL,
  amount decimal(20,8) NOT NULL,
  fee decimal(20,8) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_id text UNIQUE NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions" ON transactions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Create deposits table
CREATE TABLE deposits (
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

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own deposits" ON deposits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Create withdrawals table
CREATE TABLE withdrawals (
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

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own withdrawals" ON withdrawals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Create crypto_trades table
CREATE TABLE crypto_trades (
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

ALTER TABLE crypto_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own crypto trades" ON crypto_trades
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Create crypto_transfers table
CREATE TABLE crypto_transfers (
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

ALTER TABLE crypto_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage transfers they sent" ON crypto_transfers
  FOR ALL TO authenticated
  USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view transfers they received" ON crypto_transfers
  FOR SELECT TO authenticated USING (auth.uid() = recipient_id);

-- 9. Create airtime_purchases table
CREATE TABLE airtime_purchases (
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

ALTER TABLE airtime_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own airtime purchases" ON airtime_purchases
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Create referrals table
CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount decimal(10,2) DEFAULT 20000,
  reward_currency text DEFAULT 'UGX',
  reward_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(referrer_id, referred_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage referrals they made" ON referrals
  FOR ALL TO authenticated
  USING (auth.uid() = referrer_id) WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals they were referred by" ON referrals
  FOR SELECT TO authenticated USING (auth.uid() = referred_id);

-- 11. Create referral_earnings table
CREATE TABLE referral_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'UGX',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own referral earnings" ON referral_earnings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create all indexes
CREATE INDEX idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX idx_user_profiles_referred_by ON user_profiles(referred_by);
CREATE INDEX idx_wallets_user_currency ON wallets(user_id, currency);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_crypto_assets_symbol ON crypto_assets(symbol);
CREATE INDEX idx_crypto_assets_active ON crypto_assets(is_active);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference_id);
CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_transaction_id ON deposits(transaction_id);
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_transaction_id ON withdrawals(transaction_id);
CREATE INDEX idx_crypto_trades_user_id ON crypto_trades(user_id);
CREATE INDEX idx_crypto_trades_transaction_id ON crypto_trades(transaction_id);
CREATE INDEX idx_crypto_transfers_sender_id ON crypto_transfers(sender_id);
CREATE INDEX idx_crypto_transfers_recipient_id ON crypto_transfers(recipient_id);
CREATE INDEX idx_airtime_purchases_user_id ON airtime_purchases(user_id);
CREATE INDEX idx_airtime_purchases_transaction_id ON airtime_purchases(transaction_id);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referral_earnings_user_id ON referral_earnings(user_id);

-- Create triggers for updated_at
CREATE TRIGGER on_user_profile_updated BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER on_wallet_updated BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER on_crypto_asset_updated BEFORE UPDATE ON crypto_assets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER on_transaction_updated BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create user profile trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_profile_created BEFORE INSERT ON user_profiles FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create transaction trigger
CREATE OR REPLACE FUNCTION handle_new_transaction()
RETURNS trigger AS $$
BEGIN
  IF NEW.reference_id IS NULL OR NEW.reference_id = '' THEN
    NEW.reference_id := generate_transaction_reference();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_created BEFORE INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION handle_new_transaction();

-- Create wallet management functions
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

-- Create referral stats function
CREATE OR REPLACE FUNCTION get_referral_stats(user_uuid uuid)
RETURNS TABLE(
  total_referrals bigint,
  total_earnings decimal,
  pending_earnings decimal,
  this_month_referrals bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(r.id) as total_referrals,
    COALESCE(SUM(CASE WHEN re.status = 'paid' THEN re.amount ELSE 0 END), 0) as total_earnings,
    COALESCE(SUM(CASE WHEN re.status = 'pending' THEN re.amount ELSE 0 END), 0) as pending_earnings,
    COUNT(CASE WHEN r.created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as this_month_referrals
  FROM referrals r
  LEFT JOIN referral_earnings re ON r.id = re.referral_id
  WHERE r.referrer_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth signup trigger
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
DECLARE
  referrer_profile user_profiles%ROWTYPE;
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (
    id,
    first_name,
    last_name,
    phone,
    verification_status,
    referral_code,
    referred_by
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'verified',
    generate_referral_code(),
    CASE 
      WHEN NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
        (SELECT id FROM user_profiles WHERE referral_code = NEW.raw_user_meta_data->>'referral_code')
      ELSE NULL
    END
  );

  -- Create default UGX wallet
  INSERT INTO wallets (
    user_id,
    currency,
    balance,
    available_balance,
    locked_balance
  ) VALUES (
    NEW.id,
    'UGX',
    0,
    0,
    0
  );

  -- Handle referral if referral code was provided
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    SELECT * INTO referrer_profile 
    FROM user_profiles 
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
    
    IF referrer_profile.id IS NOT NULL THEN
      -- Create referral record
      INSERT INTO referrals (
        referrer_id,
        referred_id,
        referral_code,
        status,
        reward_amount,
        reward_currency
      ) VALUES (
        referrer_profile.id,
        NEW.id,
        NEW.raw_user_meta_data->>'referral_code',
        'pending',
        20000,
        'UGX'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- Insert sample crypto assets
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