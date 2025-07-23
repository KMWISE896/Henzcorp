import { useState, useEffect } from 'react'
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
      console.log('🚫 No user - clearing data')
      setWallets([])
      setTransactions([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Refreshing data for user:', user.id)
      
      // Fetch user wallets
      let userWallets: Wallet[] = []
      let userTransactions: Transaction[] = []
      
      try {
        console.log('📊 Fetching user wallets...')
        userWallets = await getUserWallets(user.id)
        console.log('✅ Wallets fetched successfully:', userWallets.length)
        
        // If no wallets exist, create a default UGX wallet entry for display
        if (userWallets.length === 0) {
          console.log('📝 No wallets found - user may need to make first transaction')
          userWallets = [{
            id: 'default-ugx',
            user_id: user.id,
            currency: 'UGX',
            balance: 0,
            available_balance: 0,
            locked_balance: 0,
            wallet_address: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        }
      } catch (walletError) {
        console.error('❌ Error fetching wallets:', walletError)
        
        // Check for specific error types
        if (walletError.code === 'PGRST116' || 
            walletError.message?.includes('relation') || 
            walletError.message?.includes('does not exist') ||
            walletError.message?.includes('permission denied')) {
          
          const errorMsg = 'Database tables not found or permission denied. Please check your Supabase setup.'
          console.warn('⚠️', errorMsg)
          setError(errorMsg)
        } else {
          setError(`Wallet fetch error: ${walletError.message}`)
        }
        
        // Provide fallback wallet
        userWallets = [{
          id: 'fallback-ugx',
          user_id: user.id,
          currency: 'UGX',
          balance: 0,
          available_balance: 0,
          locked_balance: 0,
          wallet_address: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      }
      
      try {
        console.log('📋 Fetching user transactions...')
        userTransactions = await getUserTransactions(user.id, 50)
        console.log('✅ Transactions fetched successfully:', userTransactions.length)
      } catch (transactionError) {
        console.error('❌ Error fetching transactions:', transactionError)
        
        if (transactionError.code === 'PGRST116' || 
            transactionError.message?.includes('relation') || 
            transactionError.message?.includes('does not exist') ||
            transactionError.message?.includes('permission denied')) {
          
          if (!error) { // Only set if we don't already have an error
            setError('Database tables not found or permission denied. Please check your Supabase setup.')
          }
        }
        
        userTransactions = []
      }
      
      setWallets(userWallets)
      setTransactions(userTransactions)
      
      console.log('✅ Data refreshed:', {
        wallets: userWallets.length,
        transactions: userTransactions.length
      })
    } catch (error) {
      console.error('❌ Critical error refreshing data:', error)
      setError(`Critical error: ${error.message}`)
      
      // Set fallback data
      setWallets([{
        id: 'error-fallback-ugx',
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
    console.log('🔄 useSupabaseData effect triggered, user:', user ? 'exists' : 'none')
    refreshData()
  }, [user])

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