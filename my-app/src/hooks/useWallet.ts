import { useState, useEffect } from 'react'
import { getUserWallets, Wallet } from '../lib/supabase'
import { useAuth } from './useAuth'

export const useWallets = () => {
  const { user } = useAuth()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (user) {
      loadWallets()
    } else {
      setWallets([])
      setLoading(false)
    }
  }, [user, refreshTrigger])

  const loadWallets = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Loading wallets for user:', user.id)
      const userWallets = await getUserWallets(user.id)
      setWallets(userWallets)
      console.log('💰 Wallets refreshed:', userWallets.map(w => `${w.currency}: ${w.available_balance}`))
    } catch (err) {
      console.error('Error loading wallets:', err)
      setError('Failed to load wallets')
    } finally {
      setLoading(false)
    }
  }

  const forceRefresh = () => {
    console.log('🔄 Force refreshing wallets...')
    console.log('📊 Current wallets before refresh:', wallets.map(w => `${w.currency}: ${w.available_balance}`))
    setRefreshTrigger(prev => prev + 1)
  }
  const getWalletBalance = (currency: string): number => {
    const wallet = wallets.find(w => w.currency === currency)
    return wallet?.available_balance || 0
  }

  const getFiatBalance = (): number => {
    return getWalletBalance('UGX')
  }

  const getCryptoBalanceUGX = (): number => {
    // Calculate crypto balance in UGX equivalent
    // This is a simplified calculation - in production you'd use real-time prices
    return wallets
      .filter(w => w.currency !== 'UGX')
      .reduce((sum, wallet) => {
        // Mock conversion rates (in production, get from crypto_assets table)
        const conversionRates: { [key: string]: number } = {
          'BTC': 165420000, // 1 BTC = 165,420,000 UGX
          'ETH': 8750000,   // 1 ETH = 8,750,000 UGX
          'LTC': 380000,    // 1 LTC = 380,000 UGX
          'USDT': 3700      // 1 USDT = 3,700 UGX
        };
        
        const rate = conversionRates[wallet.currency] || 1;
        return sum + (wallet.available_balance * rate);
      }, 0)
  }

  return {
    wallets,
    loading,
    error,
    getWalletBalance,
    getFiatBalance,
    getCryptoBalanceUGX,
    refreshWallets: forceRefresh
  }
}