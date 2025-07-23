@@ .. @@
 /*
   # Create Functions and Triggers Only
   
   This migration creates all the missing functions and triggers needed for the HenzCorp app.
   Run this if you have tables but no functions in your Supabase dashboard.
 */
 
--- Drop existing functions if they exist
-DROP FUNCTION IF EXISTS get_referral_stats(uuid);
-DROP FUNCTION IF EXISTS update_wallet_balance(uuid, text, decimal, text);
-DROP FUNCTION IF EXISTS get_user_balance(uuid, text);
-DROP FUNCTION IF EXISTS generate_transaction_reference();
-DROP FUNCTION IF EXISTS generate_referral_code();
-DROP FUNCTION IF EXISTS handle_new_user_signup();
-DROP FUNCTION IF EXISTS handle_new_user();
-DROP FUNCTION IF EXISTS handle_new_transaction();
-DROP FUNCTION IF EXISTS handle_updated_at();
+-- Drop existing triggers first (to avoid dependency issues)
+DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
+DROP TRIGGER IF EXISTS on_user_profile_created ON user_profiles;
+DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;
+DROP TRIGGER IF EXISTS on_wallet_updated ON wallets;
+DROP TRIGGER IF EXISTS on_crypto_asset_updated ON crypto_assets;
+DROP TRIGGER IF EXISTS on_transaction_created ON transactions;
+DROP TRIGGER IF EXISTS on_transaction_updated ON transactions;
+
+-- Now drop functions safely
+DROP FUNCTION IF EXISTS get_referral_stats(uuid) CASCADE;
+DROP FUNCTION IF EXISTS update_wallet_balance(uuid, text, decimal, text) CASCADE;
+DROP FUNCTION IF EXISTS get_user_balance(uuid, text) CASCADE;
+DROP FUNCTION IF EXISTS generate_transaction_reference() CASCADE;
+DROP FUNCTION IF EXISTS generate_referral_code() CASCADE;
+DROP FUNCTION IF EXISTS handle_new_user_signup() CASCADE;
+DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
+DROP FUNCTION IF EXISTS handle_new_transaction() CASCADE;
+DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;