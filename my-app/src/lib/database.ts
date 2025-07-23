import { supabase } from './supabase-client'
import type { Database } from './supabase-client'

// === Type Aliases ===
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Wallet = Database['public']['Tables']['wallets']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type CryptoAsset = Database['public']['Tables']['crypto_assets']['Row']
export type Referral = Database['public']['Tables']['referrals']['Row']

// === User Profile ===
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

  return data ?? null
}

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// === Wallets ===
export const getUserWallets = async (userId: string): Promise<Wallet[]> => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export const getWalletBalance = async (
  userId: string,
  currency: string
): Promise<number> => {
  const { data, error } = await supabase.rpc('get_user_balance', {
    user_uuid: userId,
    wallet_currency: currency
  })

  if (error) throw error
  return data ?? 0
}

export const updateWalletBalance = async (
  userId: string,
  currency: string,
  amount: number,
  operation: 'add' | 'subtract' = 'add'
) => {
  const { data, error } = await supabase.rpc('update_wallet_balance', {
    user_uuid: userId,
    wallet_currency: currency,
    amount_change: amount,
    operation_type: operation
  })

  if (error) throw error
  return data
}

// === Transactions ===
export const createTransaction = async (
  transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'reference_id'>
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserTransactions = async (
  userId: string,
  limit = 10
): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export const updateTransactionStatus = async (
  transactionId: string,
  status: Transaction['status']
): Promise<Transaction> => {
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

// === Crypto Assets ===
export const getCryptoAssets = async (): Promise<CryptoAsset[]> => {
  const { data, error } = await supabase
    .from('crypto_assets')
    .select('*')
    .eq('is_active', true)
    .order('symbol', { ascending: true })

  if (error) throw error
  return data ?? []
}

// === Deposit / Withdrawal ===
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

// === Airtime Purchases ===
export const createAirtimePurchase = async (airtimeData: any) => {
  const { data, error } = await supabase
    .from('airtime_purchases')
    .insert(airtimeData)
    .select()
    .single()

  if (error) throw error
  return data
}

// === Crypto Trading ===
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

// === Referrals ===
export const getReferralStats = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_referral_stats', {
      user_uuid: userId
    })

  if (error) throw error
  return data ?? []
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
  return data ?? []
}
