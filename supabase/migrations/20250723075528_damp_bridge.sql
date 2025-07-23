/*
  # Create user dashboard view

  1. Views
    - `user_dashboard`
      - Aggregated user data for dashboard display
      - Includes balances, transaction counts, referral stats

  2. Security
    - Enable RLS on view
    - Users can only see their own dashboard data
*/

-- Create user dashboard view
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
  up.id as user_id,
  up.first_name,
  up.last_name,
  up.referral_code,
  up.verification_status,
  -- Fiat balance (UGX)
  COALESCE(w_fiat.available_balance, 0) as fiat_balance,
  -- Total crypto balance in UGX (simplified calculation)
  COALESCE(
    (SELECT SUM(w.available_balance * ca.current_price_ugx) 
     FROM wallets w 
     JOIN crypto_assets ca ON w.currency = ca.symbol 
     WHERE w.user_id = up.id AND w.currency != 'UGX'), 0
  ) as crypto_balance_ugx,
  -- Recent transaction count
  (SELECT COUNT(*) FROM transactions t WHERE t.user_id = up.id AND t.created_at >= NOW() - INTERVAL '30 days') as recent_transactions,
  -- Referral stats
  (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = up.id) as total_referrals,
  up.created_at,
  up.updated_at
FROM user_profiles up
LEFT JOIN wallets w_fiat ON up.id = w_fiat.user_id AND w_fiat.currency = 'UGX';

-- Enable RLS on view
ALTER VIEW user_dashboard SET (security_invoker = true);

-- Create policy for dashboard view (users can only see their own data)
-- Note: RLS policies on views work through the underlying tables