/*
  # Complete Database Reset (NUCLEAR OPTION)
  
  ⚠️  WARNING: This will delete ALL user data!
  Only run this if you want to start completely fresh.
*/

-- 1. Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_profile_created ON user_profiles;
DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;
DROP TRIGGER IF EXISTS on_wallet_updated ON wallets;
DROP TRIGGER IF EXISTS on_transaction_created ON transactions;
DROP TRIGGER IF EXISTS on_transaction_updated ON transactions;

-- 2. Delete all user data (in correct order to handle foreign keys)
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

-- 3. Delete auth users (this will remove all authentication data)
-- UNCOMMENT ONLY IF YOU WANT TO DELETE ALL USERS:
-- DELETE FROM auth.users;

-- 4. Reset sequences (if any)
-- This ensures IDs start from 1 again

-- 5. Recreate basic auth trigger
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (
    id, first_name, last_name, phone, verification_status, referral_code
  ) VALUES (
    NEW.id, 'User', 'Name', '', 'verified',
    'HENZ2025' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6))
  );
  
  INSERT INTO wallets (user_id, currency, balance, available_balance, locked_balance)
  VALUES (NEW.id, 'UGX', 0, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

SELECT 'Database completely reset!' as status;