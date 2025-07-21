import { useState, useEffect } from 'react'
import { getUserWallets, getUserTransactions, type Wallet, type Transaction } from '../lib/database'
import { useSupabaseAuth } from './useSupabaseAuth'

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
      console.log('🔄 Refreshing data for user:', user.id)
      
      const [userWallets, userTransactions] = await Promise.all([
        getUserWallets(user.id),
        getUserTransactions(user.id, 50)
      ])
      
      setWallets(userWallets)
      setTransactions(userTransactions)
      
      console.log('✅ Data refreshed:', {
        wallets: userWallets.length,
        transactions: userTransactions.length
      })
    } catch (error) {
      console.error('❌ Error refreshing data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  useEffect(() => {
    refreshData()
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