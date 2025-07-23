-- Fix the auth trigger to handle existing users properly

-- Drop and recreate the auth signup function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
DECLARE
  referrer_profile user_profiles%ROWTYPE;
BEGIN
  -- Check if user profile already exists
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.id) THEN
    -- User profile already exists, just return
    RETURN NEW;
  END IF;

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
    'HENZ' || EXTRACT(YEAR FROM NOW()) || UPPER(SUBSTRING(MD5(RANDOM()::text || NEW.id::text) FROM 1 FOR 6)),
    CASE 
      WHEN NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
        (SELECT id FROM user_profiles WHERE referral_code = NEW.raw_user_meta_data->>'referral_code')
      ELSE NULL
    END
  );

  -- Check if UGX wallet already exists
  IF NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = NEW.id AND currency = 'UGX') THEN
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
  END IF;

  -- Handle referral if referral code was provided
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    SELECT * INTO referrer_profile 
    FROM user_profiles 
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
    
    IF referrer_profile.id IS NOT NULL THEN
      -- Create referral record (only if it doesn't exist)
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
      )
      ON CONFLICT (referrer_id, referred_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Error in handle_new_user_signup: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();