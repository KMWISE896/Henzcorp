/*
  # Create referrals and referral earnings tables

  1. New Tables
    - `referrals`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, references user_profiles, required)
      - `referred_id` (uuid, references user_profiles, required)
      - `referral_code` (text, required)
      - `status` (text, default 'pending')
      - `reward_amount` (decimal, default 20000)
      - `reward_currency` (text, default 'UGX')
      - `reward_paid` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `completed_at` (timestamptz, optional)

    - `referral_earnings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles, required)
      - `referral_id` (uuid, references referrals, required)
      - `amount` (decimal, required)
      - `currency` (text, default 'UGX')
      - `status` (text, default 'pending')
      - `paid_at` (timestamptz, optional)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own referrals

  3. Functions
    - Get referral statistics
*/

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount decimal(10,2) DEFAULT 20000,
  reward_currency text DEFAULT 'UGX',
  reward_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(referrer_id, referred_id)
);

-- Create referral earnings table
CREATE TABLE IF NOT EXISTS referral_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'UGX',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;

-- Create policies for referrals
CREATE POLICY "Users can manage referrals they made"
  ON referrals
  FOR ALL
  TO authenticated
  USING (auth.uid() = referrer_id)
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals they were referred by"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_id);

-- Create policies for referral earnings
CREATE POLICY "Users can manage own referral earnings"
  ON referral_earnings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_earnings_user_id ON referral_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referral_id ON referral_earnings(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_status ON referral_earnings(status);

-- Create function to get referral statistics
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