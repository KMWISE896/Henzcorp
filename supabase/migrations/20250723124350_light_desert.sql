-- Clean up any orphaned auth users without profiles

-- First, let's see what we have
SELECT 
  au.id as auth_user_id,
  au.email,
  up.id as profile_id,
  up.first_name,
  up.last_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;

-- Delete orphaned auth users that don't have profiles
-- (This will clean up failed signups)
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM user_profiles WHERE id IS NOT NULL);

-- Alternative: If you want to keep the auth users and just create missing profiles
-- Uncomment this instead:
/*
INSERT INTO user_profiles (
  id, first_name, last_name, phone, verification_status, referral_code
)
SELECT 
  au.id,
  'User',
  'Name', 
  '',
  'verified',
  'HENZ2025' || UPPER(SUBSTRING(MD5(RANDOM()::text || au.id::text) FROM 1 FOR 6))
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
*/