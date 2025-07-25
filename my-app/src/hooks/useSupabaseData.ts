import { useState, useEffect } from 'react'
import { getUserWallets, getUserTransactions, type Wallet, type Transaction } from '../lib/database'
import { useSupabaseAuth } from './useSupabaseAuth'
import { supabase } from '../lib/supabase-client'

export const useSupabaseData = () => {
  const { user } = useSupabaseAuth()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const refreshData = async () => {
    if (!user) {
      setWallets([])
      setTransactions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const [userWallets, userTransactions] = await Promise.all([
        getUserWallets(user.id),
        getUserTransactions(user.id, 50)
      ])

      setWallets(userWallets)
      setTransactions(userTransactions)
    } catch (error) {
      console.error('❌ Error refreshing data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Balances...
  const getFiatBalance = (): number => {
    const wallet = wallets.find(w => w.currency === 'UGX')
    return wallet?.available_balance || 0
  }

  const getCryptoBalanceUGX = (): number => {
    const conversionRates: { [key: string]: number } = {
      'BTC': 165420000,
      'ETH': 8750000,
      'LTC': 380000,
      'USDT': 3700
    }

    return wallets
      .filter(w => w.currency !== 'UGX')
      .reduce((sum, wallet) => {
        const rate = conversionRates[wallet.currency] || 1
        return sum + (wallet.available_balance * rate)
      }, 0)
  }

  const getWalletBalance = (currency: string): number => {
    const wallet = wallets.find(w => w.currency === currency)
    return wallet?.available_balance || 0
  }

  // 🔁 Realtime subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('realtime:transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Realtime transaction update:', payload)
          refreshData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      refreshData()
    } else {
      setWallets([])
      setTransactions([])
      setLoading(false)
    }
  }, [user])

  return {
    wallets,
    transactions,
    loading,
    refreshData,
    getFiatBalance,
    getCryptoBalanceUGX,
    getWalletBalance
  }
}
