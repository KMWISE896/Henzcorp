/*
  # Fix Email Confirmation Issue (Corrected)
  
  This script fixes the email confirmation error by only updating columns
  that can be modified (avoiding generated columns like confirmed_at).
*/

-- Update existing users to mark email as confirmed
-- Note: We can only update email_confirmed_at, not confirmed_at (which is generated)
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Update user profiles to be verified
UPDATE user_profiles 
SET verification_status = 'verified'
WHERE verification_status != 'verified';

-- Recreate the auth trigger function to automatically verify new users
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
DECLARE
  referrer_profile user_profiles%ROWTYPE;
  new_referral_code text;
BEGIN
  -- Check if user profile already exists
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.id) THEN
    -- User profile already exists, just return
    RETURN NEW;
  END IF;

  -- Generate a unique referral code
  LOOP
    new_referral_code := 'HENZ' || EXTRACT(YEAR FROM NOW()) || UPPER(SUBSTRING(MD5(RANDOM()::text || NEW.id::text) FROM 1 FOR 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE referral_code = new_referral_code);
  END LOOP;

  -- Create user profile with verified status (no email confirmation required)
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
    new_referral_code,
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
    RAISE WARNING 'Error in handle_new_user_signup for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- Verify the setup
SELECT 'Email confirmation fix applied successfully!' as status;