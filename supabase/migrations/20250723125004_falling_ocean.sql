/*
  # Revert SQL Changes
  
  Run this in your Supabase Dashboard → SQL Editor to undo recent changes
*/

-- 1. Drop the modified auth trigger function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_signup() CASCADE;

-- 2. If you ran the cleanup script, you may have deleted some auth users
-- Check what auth users exist without profiles:
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at,
  up.id as profile_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- 3. Recreate the original auth trigger function (if it existed)
-- Note: This is a basic version - you may need to adjust based on your original setup
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (
    id,
    first_name,
    last_name,
    phone,
    verification_status,
    referral_code
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'verified',
    'HENZ2025' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6))
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- 5. If you want to completely reset and remove all user data (CAREFUL!)
-- Uncomment these lines only if you want to start fresh:
/*
DELETE FROM referral_earnings;
DELETE FROM referrals;
DELETE FROM airtime_purchases;
DELETE FROM crypto_transfers;
DELETE FROM crypto_trades;
DELETE FROM withdrawals;
DELETE FROM deposits;
DELETE FROM transactions;
DELETE FROM wallets;
DELETE FROM user_profiles;
-- Note: This will NOT delete auth.users - you'd need to do that separately
*/