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
      
      // Try to get user wallets with timeout and error handling
      let userWallets: Wallet[] = []
      let userTransactions: Transaction[] = []
      
      try {
        console.log('📊 Fetching user wallets...')
        userWallets = await Promise.race([
          getUserWallets(user.id),
          new Promise<Wallet[]>((_, reject) => 
            setTimeout(() => reject(new Error('Wallet fetch timeout')), 10000)
          )
        ])
        console.log('✅ Wallets fetched:', userWallets.length)
      } catch (walletError) {
        console.error('❌ Error fetching wallets:', walletError)
        // Create default UGX wallet if none exists
        userWallets = [{
          id: 'temp-ugx',
          user_id: user.id,
          currency: 'UGX',
          balance: 0,
          available_balance: 0,
          locked_balance: 0,
          wallet_address: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
        console.log('🔧 Using fallback UGX wallet')
      }
      
      try {
        console.log('📋 Fetching user transactions...')
        userTransactions = await Promise.race([
          getUserTransactions(user.id, 50),
          new Promise<Transaction[]>((_, reject) => 
            setTimeout(() => reject(new Error('Transaction fetch timeout')), 20000)
          )
        ])
        console.log('✅ Transactions fetched:', userTransactions.length)
      } catch (transactionError) {
        console.error('❌ Error fetching transactions:', transactionError)
        userTransactions = []
        console.log('🔧 Using empty transactions array')
      }
      
      setWallets(userWallets)
      setTransactions(userTransactions)
      
      console.log('✅ Data refreshed:', {
        wallets: userWallets.length,
        transactions: userTransactions.length
      })
    } catch (error) {
      console.error('❌ Critical error refreshing data:', error)
      // Set fallback data to prevent infinite loading
      setWallets([{
        id: 'fallback-ugx',
        user_id: user.id,
        currency: 'UGX',
        balance: 0,
        available_balance: 0,
        locked_balance: 0,
        wallet_address: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      setTransactions([])
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