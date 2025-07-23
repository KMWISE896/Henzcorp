/*
  # Setup authentication triggers

  1. Functions
    - Handle new user signup
    - Create default user profile and wallet
    - Process referral relationships

  2. Triggers
    - Auto-create profile on user signup
    - Auto-create default UGX wallet
*/

-- Function to handle new user signup
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
    'pending',
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

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_delete()
RETURNS trigger AS $$
BEGIN
  -- Delete user profile (cascades to other tables)
  DELETE FROM user_profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_delete();