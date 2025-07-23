/*
  # Revert Cleanup Changes
  
  Run this to undo any user cleanup operations
*/

-- 1. Check what auth users were potentially deleted
-- (This will show if there are auth users without profiles)
SELECT 
  'Checking for orphaned auth users...' as status;

SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN up.id IS NULL THEN 'NO PROFILE - May have been cleaned up'
    ELSE 'HAS PROFILE - OK'
  END as profile_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;

-- 2. If you deleted auth users and want to restore them, 
-- you would need to recreate them manually or from a backup
-- Unfortunately, once auth.users are deleted, they can't be automatically restored

-- 3. If you want to create missing profiles for existing auth users:
INSERT INTO user_profiles (
  id,
  first_name,
  last_name,
  phone,
  verification_status,
  referral_code
)
SELECT 
  au.id,
  'Restored',
  'User',
  '',
  'pending',
  'HENZ2025' || UPPER(SUBSTRING(MD5(RANDOM()::text || au.id::text) FROM 1 FOR 6))
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Create missing UGX wallets for users without them:
INSERT INTO wallets (
  user_id,
  currency,
  balance,
  available_balance,
  locked_balance
)
SELECT 
  up.id,
  'UGX',
  0,
  0,
  0
FROM user_profiles up
LEFT JOIN wallets w ON up.id = w.user_id AND w.currency = 'UGX'
WHERE w.id IS NULL
ON CONFLICT (user_id, currency) DO NOTHING;

SELECT 'Cleanup revert completed!' as status;