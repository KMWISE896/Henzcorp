/*
  # Create Functions and Triggers Only
  
  This migration creates all the missing functions and triggers needed for the HenzCorp app.
  Run this if you have tables but no functions in your Supabase dashboard.
*/

-- Drop existing triggers first (to avoid dependency issues)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_profile_created ON user_profiles;
DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;
DROP TRIGGER IF EXISTS on_wallet_updated ON wallets;
DROP TRIGGER IF EXISTS on_crypto_asset_updated ON crypto_assets;
DROP TRIGGER IF EXISTS on_transaction_created ON transactions;
DROP TRIGGER IF EXISTS on_transaction_updated ON transactions;

-- Now drop functions safely
DROP FUNCTION IF EXISTS get_referral_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_wallet_balance(uuid, text, decimal, text) CASCADE;
DROP FUNCTION IF EXISTS get_user_balance(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS generate_transaction_reference() CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_signup() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_transaction() CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;

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

-- Create user profile trigger function
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

-- Create transaction trigger function
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

-- Create the critical auth signup trigger function
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
DECLARE
  referrer_profile user_profiles%ROWTYPE;
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (
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

-- Create triggers for updated_at
CREATE TRIGGER on_user_profile_updated 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_wallet_updated 
  BEFORE UPDATE ON wallets 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_crypto_asset_updated 
  BEFORE UPDATE ON crypto_assets 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_transaction_updated 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create user profile trigger
CREATE TRIGGER on_user_profile_created 
  BEFORE INSERT ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create transaction trigger
CREATE TRIGGER on_transaction_created 
  BEFORE INSERT ON transactions 
  FOR EACH ROW EXECUTE FUNCTION handle_new_transaction();

-- Create the critical auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- Insert sample crypto assets if they don't exist
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