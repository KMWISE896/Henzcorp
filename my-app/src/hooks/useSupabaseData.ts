
// Updated `useSupabaseData.ts`
import { useState, useEffect, useMemo } from 'react'
import { getUserWallets, getUserTransactions, type Wallet, type Transaction } from '../lib/database'
import { useSupabaseAuth } from './useSupabaseAuth'

export const useSupabaseData = () => {
  const { user } = useSupabaseAuth()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      const userWallets = await getUserWallets(user.id)
      const safeWallets = userWallets.length > 0 ? userWallets : [getDefaultWallet(user.id)]
      setWallets(safeWallets)

      const userTransactions = await getUserTransactions(user.id, 50)
      setTransactions(userTransactions)
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
    if (user) refreshData()
  }, [user])

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

  const conversionRates: Record<string, number> = {
    BTC: 165420000,
    ETH: 8750000,
    LTC: 380000,
    USDT: 3700
  }

  const getFiatBalance = useMemo(() => {
    const wallet = wallets.find(w => w.currency === 'UGX')
    return wallet?.available_balance || 0
  }, [wallets])

  const getCryptoBalanceUGX = useMemo(() => {
    return wallets
      .filter(w => w.currency !== 'UGX')
      .reduce((sum, w) => sum + (w.available_balance * (conversionRates[w.currency] || 1)), 0)
  }, [wallets])

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



// You can also ensure all other database functions throw on error and log appropriately.
