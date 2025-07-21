import React, { createContext, useContext, ReactNode } from 'react'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { useSupabaseData } from '../hooks/useSupabaseData'

interface SupabaseContextType {
  // Auth
  user: any
  profile: any
  session: any
  loading: boolean
  isAuthenticated: boolean
  refreshProfile: () => Promise<void>
  
  // Data
  wallets: any[]
  transactions: any[]
  dataLoading: boolean
  refreshData: () => Promise<void>
  getFiatBalance: () => number
  getCryptoBalanceUGX: () => number
  getWalletBalance: (currency: string) => number
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider')
  }
  return context
}

interface SupabaseProviderProps {
  children: ReactNode
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const auth = useSupabaseAuth()
  const data = useSupabaseData()

  const value: SupabaseContextType = {
    // Auth
    user: auth.user,
    profile: auth.profile,
    session: auth.session,
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    refreshProfile: auth.refreshProfile,
    
    // Data
    wallets: data.wallets,
    transactions: data.transactions,
    dataLoading: data.loading,
    refreshData: data.refreshData,
    getFiatBalance: data.getFiatBalance,
    getCryptoBalanceUGX: data.getCryptoBalanceUGX,
    getWalletBalance: data.getWalletBalance
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}