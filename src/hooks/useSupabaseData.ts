import { useState, useEffect, useMemo } from 'react'
import { getUserWallets, getUserTransactions, type Wallet, type Transaction } from '../lib/database'
import { useSupabaseAuth } from './useSupabaseAuth'

export const useSupabaseData = () => {
  const { user, session } = useSupabaseAuth()  // <-- now grabbing session also
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getDefaultWallet = (userId: string): Wallet => ({
    id: 'default-ugx',
    user_id: userId,
    currency: 'UGX',
    balance: 0,
    available_balance: 0,
    locked_balance: 0,
    wallet_address: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  const refreshData = async () => {
    if (!user) {
      setWallets([])
      setTransactions([])
      setError(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Refreshing user data...')

      const userWallets = await getUserWallets(user.id)
      const safeWallets = userWallets.length > 0 ? userWallets : [getDefaultWallet(user.id)]
      setWallets(safeWallets)

      const userTransactions = await getUserTransactions(user.id, 50)
      setTransactions(userTransactions)
      
      console.log('✅ Data refreshed successfully:', {
        wallets: safeWallets.length,
        transactions: userTransactions.length
      })
    } catch (err: any) {
      console.error('Data fetch error:', err)
      setError(err.message || 'Unknown error')
      setWallets([getDefaultWallet(user?.id)])
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && session) {
      console.log('✅ Authenticated session found, refreshing data...')
      refreshData()
    } else {
      console.log('⏸️ Skipping data fetch: user or session missing')
    }
  }, [user, session])

  const conversionRates: Record<string, number> = {
    BTC: 165420000,
    ETH: 8750000,
    LTC: 380000,
    USDT: 3700
  }

  const fiatBalance = useMemo(() => {
  const wallet = wallets.find(w => w.currency === 'UGX')
  return wallet?.available_balance || 0
}, [wallets])

const cryptoBalanceUGX = useMemo(() => {
  return wallets
    .filter(w => w.currency !== 'UGX')
    .reduce((sum, w) => sum + (w.available_balance * (conversionRates[w.currency] || 1)), 0)
}, [wallets])

const getFiatBalance = () => fiatBalance
const getCryptoBalanceUGX = () => cryptoBalanceUGX

  const getWalletBalance = (currency: string): number => {
    const wallet = wallets.find(w => w.currency === currency)
    return wallet?.available_balance || 0
  }

  return {
    wallets,
    transactions,
    loading,
    error,
    refreshData,
    getFiatBalance,
    getCryptoBalanceUGX,
    getWalletBalance
  }
}
