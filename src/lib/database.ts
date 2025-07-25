import { supabase } from './supabase-client'
import type { Database } from './supabase-client'

// Type aliases for easier use
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Wallet = Database['public']['Tables']['wallets']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type CryptoAsset = Database['public']['Tables']['crypto_assets']['Row']
export type Referral = Database['public']['Tables']['referrals']['Row']

// Authentication functions
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
    // Sign up user with metadata for the database trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          referral_code: userData.referralCode
        }
      }
    })

    if (authError) throw authError
    
    // The database trigger will handle creating user profile and wallet
    // Return the auth data directly
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

// User Profile functions
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const maxRetries = 5
  const retryDelay = 1000 // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error(`Attempt ${attempt} - Error fetching user profile:`, error)
      if (attempt === maxRetries) throw error
    } else if (data) {
      console.log(`✅ User profile loaded on attempt ${attempt}`)
      return data
    } else {
      console.log(`⏳ Attempt ${attempt} - User profile not found, retrying...`)
    }
    
    // Wait before retrying (except on last attempt)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
  
  // If profile still not found after retries, create it manually as fallback
  console.log('🔧 Creating user profile manually as fallback...')
  return await createUserProfileFallback(userId)
}

// Fallback function to create user profile if database trigger fails
const createUserProfileFallback = async (userId: string): Promise<UserProfile> => {
  try {
    // Get user data from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    
    // Generate referral code
    const generateReferralCode = () => {
      const year = new Date().getFullYear()
      const randomString = Math.random().toString(36).substring(2, 8).toUpperCase()
      return `HENZ${year}${randomString}`
    }
    
    // Create user profile manually
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        first_name: user?.user_metadata?.first_name || 'User',
        last_name: user?.user_metadata?.last_name || 'Name',
        phone: user?.user_metadata?.phone || '',
        verification_status: 'verified',
        referral_code: generateReferralCode()
      })
      .select()
      .single()
    
    if (profileError) throw profileError
    
    // Create default UGX wallet
    const { error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        currency: 'UGX',
        balance: 0,
        available_balance: 0,
        locked_balance: 0
      })
    
    if (walletError) {
      console.warn('Failed to create wallet:', walletError)
      // Don't throw error for wallet creation failure
    }
    
    console.log('✅ User profile created manually')
    return profile
    
  } catch (error) {
    console.error('Failed to create user profile fallback:', error)
    throw new Error('Failed to create user profile')
  }
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Wallet functions
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

// Transaction functions
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

// Crypto functions
export const getCryptoAssets = async (): Promise<CryptoAsset[]> => {
  const { data, error } = await supabase
    .from('crypto_assets')
    .select('*')
    .eq('is_active', true)
    .order('symbol', { ascending: true })

  if (error) throw error
  return data || []
}

// Deposit/Withdrawal functions
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

// Airtime functions
export const createAirtimePurchase = async (airtimeData: any) => {
  const { data, error } = await supabase
    .from('airtime_purchases')
    .insert(airtimeData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Crypto trading functions
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

// Referral functions
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

// Utility functions
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

// Helper function to generate referral codes
const generateReferralCode = (): string => {
  const year = new Date().getFullYear()
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `HENZ${year}${randomString}`
} 