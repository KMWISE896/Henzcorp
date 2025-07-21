# HenzCorp Cryptocurrency Mobile App - Database Schema

## 📊 Database Overview

The HenzCorp app uses **Supabase PostgreSQL** with the following key features:
- **Row Level Security (RLS)** enabled on all tables
- **Automatic triggers** for timestamps and reference generation
- **Foreign key constraints** for data integrity
- **Comprehensive indexing** for performance

---

## 🗂️ Database Tables Structure

### 1. **user_profiles** - User Management
```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  profile_image_url text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose**: Stores user profile information and referral relationships
**Key Features**:
- Auto-generated unique referral codes (format: HENZ2024XXXXXX)
- Verification status tracking
- Self-referencing for referral chains

---

### 2. **wallets** - Multi-Currency Wallet System
```sql
CREATE TABLE wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  currency text NOT NULL,
  balance decimal(20,8) DEFAULT 0,
  available_balance decimal(20,8) DEFAULT 0,
  locked_balance decimal(20,8) DEFAULT 0,
  wallet_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, currency)
);
```

**Purpose**: Manages user balances for multiple currencies (UGX, BTC, ETH, LTC, USDT)
**Key Features**:
- Separate available and locked balances
- Support for both fiat and cryptocurrency
- Unique constraint prevents duplicate currency wallets per user

---

### 3. **crypto_assets** - Cryptocurrency Market Data
```sql
CREATE TABLE crypto_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text UNIQUE NOT NULL,
  name text NOT NULL,
  current_price_ugx decimal(20,8) NOT NULL DEFAULT 0,
  market_cap decimal(20,2) DEFAULT 0,
  volume_24h decimal(20,2) DEFAULT 0,
  price_change_24h decimal(10,4) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose**: Stores cryptocurrency market data and pricing information
**Sample Data**:
- BTC: 165,420,000 UGX
- ETH: 8,750,000 UGX
- USDT: 3,700 UGX
- LTC: 380,000 UGX

---

### 4. **transactions** - Core Transaction System
```sql
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'buy_crypto', 'sell_crypto', 'airtime_purchase')),
  currency text NOT NULL,
  amount decimal(20,8) NOT NULL,
  fee decimal(20,8) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_id text UNIQUE NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose**: Central transaction logging for all financial operations
**Key Features**:
- Auto-generated unique reference IDs (format: TXN20240118XXXXXXXX)
- Flexible metadata storage using JSONB
- Comprehensive transaction type coverage

---

### 5. **deposits** - Deposit Transaction Details
```sql
CREATE TABLE deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  payment_method text NOT NULL CHECK (payment_method IN ('mtn_money', 'airtel_money', 'bank_transfer')),
  amount decimal(20,8) NOT NULL,
  currency text NOT NULL,
  external_reference text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);
```

**Purpose**: Tracks deposit-specific information and payment methods

---

### 6. **withdrawals** - Withdrawal Transaction Details
```sql
CREATE TABLE withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  withdrawal_method text NOT NULL CHECK (withdrawal_method IN ('mtn_money', 'airtel_money', 'bank_transfer')),
  amount decimal(20,8) NOT NULL,
  currency text NOT NULL,
  destination_details jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);
```

**Purpose**: Manages withdrawal requests with flexible destination details

---

### 7. **crypto_trades** - Cryptocurrency Trading
```sql
CREATE TABLE crypto_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  trade_type text NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  crypto_symbol text NOT NULL,
  crypto_amount decimal(20,8) NOT NULL,
  fiat_amount decimal(20,2) NOT NULL,
  fiat_currency text DEFAULT 'UGX',
  price_per_unit decimal(20,8) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);
```

**Purpose**: Records cryptocurrency buy/sell transactions with pricing details

---

### 8. **crypto_transfers** - Crypto Transfer System
```sql
CREATE TABLE crypto_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES user_profiles(id),
  recipient_address text,
  crypto_symbol text NOT NULL,
  amount decimal(20,8) NOT NULL,
  network_fee decimal(20,8) DEFAULT 0,
  transfer_type text NOT NULL CHECK (transfer_type IN ('internal', 'external')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  memo text,
  created_at timestamptz DEFAULT now()
);
```

**Purpose**: Handles both internal (user-to-user) and external crypto transfers

---

### 9. **airtime_purchases** - Mobile Airtime System
```sql
CREATE TABLE airtime_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  network text NOT NULL CHECK (network IN ('mtn', 'airtel', 'utl')),
  amount decimal(10,2) NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('self', 'other')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  external_reference text,
  created_at timestamptz DEFAULT now()
);
```

**Purpose**: Manages airtime purchases for Uganda mobile networks

---

### 10. **referrals** - Referral System
```sql
CREATE TABLE referrals (
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
```

**Purpose**: Tracks referral relationships and reward payments

---

### 11. **referral_earnings** - Referral Reward Tracking
```sql
CREATE TABLE referral_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'UGX',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Purpose**: Manages referral earnings and payment status

---

## 🔐 Security Features

### Row Level Security (RLS) Policies

**User Profiles:**
```sql
-- Users can manage their own profile
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users can read profiles for referral purposes
CREATE POLICY "Users can read profiles for referrals" ON user_profiles
  FOR SELECT TO authenticated USING (true);
```

**Wallets:**
```sql
-- Users can only access their own wallets
CREATE POLICY "Users can manage own wallets" ON wallets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**Transactions:**
```sql
-- Users can only access their own transactions
CREATE POLICY "Users can manage own transactions" ON transactions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## ⚡ Performance Optimizations

### Database Indexes
```sql
-- User profiles indexes
CREATE INDEX idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX idx_user_profiles_referred_by ON user_profiles(referred_by);

-- Wallet indexes
CREATE INDEX idx_wallets_user_currency ON wallets(user_id, currency);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Transaction indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Referral indexes
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);
```

---

## 🔧 Utility Functions

### Balance Management
```sql
-- Get user's wallet balance
CREATE OR REPLACE FUNCTION get_user_balance(user_uuid uuid, wallet_currency text)
RETURNS decimal AS $$
DECLARE
  balance_amount decimal;
BEGIN
  SELECT COALESCE(available_balance, 0) INTO balance_amount
  FROM wallets
  WHERE user_id = user_uuid AND currency = wallet_currency;
  
  RETURN COALESCE(balance_amount, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Referral Statistics
```sql
-- Get referral statistics
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
```

---

## 📊 Dashboard View
```sql
-- User dashboard data
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
  up.id as user_id,
  up.first_name,
  up.last_name,
  up.referral_code,
  up.verification_status,
  -- Fiat balance (UGX)
  COALESCE(w_fiat.available_balance, 0) as fiat_balance,
  -- Total crypto balance in UGX
  COALESCE(SUM(w_crypto.available_balance * ca.current_price_ugx), 0) as crypto_balance_ugx,
  -- Recent transaction count
  (SELECT COUNT(*) FROM transactions t WHERE t.user_id = up.id AND t.created_at >= NOW() - INTERVAL '30 days') as recent_transactions,
  -- Referral stats
  (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = up.id) as total_referrals
FROM user_profiles up
LEFT JOIN wallets w_fiat ON up.id = w_fiat.user_id AND w_fiat.currency = 'UGX'
LEFT JOIN wallets w_crypto ON up.id = w_crypto.user_id AND w_crypto.currency != 'UGX'
LEFT JOIN crypto_assets ca ON w_crypto.currency = ca.symbol
GROUP BY up.id, up.first_name, up.last_name, up.referral_code, up.verification_status, w_fiat.available_balance;
```

---

## 🚀 Key Database Features

### ✅ **Comprehensive Transaction Tracking**
- All financial operations logged with full audit trail
- Automatic reference ID generation
- Status tracking throughout transaction lifecycle

### ✅ **Multi-Currency Support**
- Separate wallets for each currency (UGX, BTC, ETH, LTC, USDT)
- Real-time balance management
- Crypto-to-fiat conversion capabilities

### ✅ **Robust Security**
- Row Level Security on all tables
- User isolation and data protection
- Proper authentication and authorization

### ✅ **Scalable Architecture**
- Indexed for performance
- Normalized database design
- Flexible metadata storage with JSONB

### ✅ **Business Logic Integration**
- Automatic referral code generation
- Fee calculation and tracking
- Reward system implementation

---

## 📈 Sample Data Flow

### User Registration:
1. **auth.users** → User account created
2. **user_profiles** → Profile with auto-generated referral code
3. **wallets** → Default UGX wallet created
4. **referrals** → Referral relationship (if referral code used)

### Deposit Transaction:
1. **transactions** → Main transaction record
2. **deposits** → Deposit-specific details
3. **wallets** → Balance updated
4. **transaction status** → Updated to 'completed'

### Crypto Trade:
1. **transactions** → Trade transaction record
2. **crypto_trades** → Trade details with pricing
3. **wallets** → UGX and crypto balances updated
4. **crypto_assets** → Current market prices referenced

This database schema provides a robust foundation for the HenzCorp cryptocurrency mobile app with comprehensive financial tracking, security, and scalability features.