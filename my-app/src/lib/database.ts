import { supabase } from './supabase-client'
import type { Database } from './supabase-client'

// Type aliases
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Wallet = Database['public']['Tables']['wallets']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type CryptoAsset = Database['public']['Tables']['crypto_assets']['Row']
export type Referral = Database['public']['Tables']['referrals']['Row']

// Auth functions
export const signUp = async (
  email: string,
  password: string,
  userData: {
    firstName: string
    lastName: string
    phone: string
    referralCode?: string
  }
) => {
  try {
    // Format phone number before passing to auth
    const formattedPhone = formatPhoneNumber(userData.phone)

    // Pass all user data through auth metadata - the backend trigger will handle profile/wallet creation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: formattedPhone,
          referral_code: userData.referralCode || null
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    return authData
  } catch (error) {
    console.error('Signup error:', error)
    throw error
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Signin error:', error)
    throw error
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// User Profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('❌ Error fetching user profile:', error)
    throw error
  }

  if (!data) {
    console.warn('⚠️ No profile found for user ID:', userId)
    return null
  }

  return data
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// Wallets
export const getUserWallets = async (userId: string): Promise<Wallet[]> => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export const getWalletBalance = async (userId: string, currency: string): Promise<number> => {
  const { data, error } = await supabase
    .rpc('get_user_balance', {
      user_uuid: userId,
      wallet_currency: currency
    })

  if (error) throw error
  return data || 0
}

export const updateWalletBalance = async (
  userId: string,
  currency: string,
  amount: number,
  operation: 'add' | 'subtract' = 'add'
) => {
  const { data, error } = await supabase
    .rpc('update_wallet_balance', {
      user_uuid: userId,
      wallet_currency: currency,
      amount_change: amount,
      operation_type: operation
    })

  if (error) throw error
  return data
}

// Transactions
export const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'reference_id'>): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserTransactions = async (userId: string, limit = 10): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export const updateTransactionStatus = async (transactionId: string, status: Transaction['status']) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Crypto
export const getCryptoAssets = async (): Promise<CryptoAsset[]> => {
  const { data, error } = await supabase
    .from('crypto_assets')
    .select('*')
    .eq('is_active', true)
    .order('symbol', { ascending: true })

  if (error) throw error
  return data || []
}

// Deposit / Withdrawal
export const createDeposit = async (depositData: any) => {
  const { data, error } = await supabase
    .from('deposits')
    .insert(depositData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const createWithdrawal = async (withdrawalData: any) => {
  const { data, error } = await supabase
    .from('withdrawals')
    .insert(withdrawalData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Airtime
export const createAirtimePurchase = async (airtimeData: any) => {
  const { data, error } = await supabase
    .from('airtime_purchases')
    .insert(airtimeData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Crypto Trading
export const createCryptoTrade = async (tradeData: any) => {
  const { data, error } = await supabase
    .from('crypto_trades')
    .insert(tradeData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const createCryptoTransfer = async (transferData: any) => {
  const { data, error } = await supabase
    .from('crypto_transfers')
    .insert(transferData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Referrals
export const getReferralStats = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_referral_stats', {
      user_uuid: userId
    })

  if (error) throw error
  return data || []
}

export const getUserReferrals = async (userId: string) => {
  const { data, error } = await supabase
    .from('referrals')
    .select(`
      *,
      referred:user_profiles!referrals_referred_id_fkey(
        first_name,
        last_name,
        created_at
      )
    `)
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Utils
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('256')) {
    return `+${cleaned}`
  }
  if (cleaned.startsWith('0')) {
    return `+256${cleaned.substring(1)}`
  }
  if (cleaned.length === 9) {
    return `+256${cleaned}`
  }
  return `+${cleaned}`
}

export const detectNetwork = (phone: string): 'mtn' | 'airtel' | 'utl' => {
  const cleaned = phone.replace(/\D/g, '')
  const lastDigits = cleaned.slice(-9)

  if (lastDigits.startsWith('77') || lastDigits.startsWith('78') ||
      lastDigits.startsWith('76') || lastDigits.startsWith('39')) {
    return 'mtn'
  }

  if (lastDigits.startsWith('75') || lastDigits.startsWith('70') ||
      lastDigits.startsWith('74') || lastDigits.startsWith('20')) {
    return 'airtel'
  }

  if (lastDigits.startsWith('71') || lastDigits.startsWith('31')) {
    return 'utl'
  }

  return 'mtn'
}

const generateReferralCode = (): string => {
  const year = new Date().getFullYear()
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `HENZ${year}${randomString}`
}