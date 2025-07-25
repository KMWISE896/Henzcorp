// hooks/useSupabaseAuth.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase-client'
import { 
  getUserProfile, 
  getUserWallets, 
  getUserTransactions,
  type UserProfile,
  type Wallet,
  type Transaction
} from '../lib/database'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  wallets: Wallet[]
  transactions: Transaction[]
  session: Session | null
  loading: boolean
  dataLoading: boolean
}

export const useSupabaseAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    wallets: [],
    transactions: [],
    session: null,
    loading: true,
    dataLoading: false
  })

  const loadUserData = async (userId: string) => {
    setState(prev => ({ ...prev, dataLoading: true }))
    
    try {
      console.log('📊 Loading all user data...')
      const [profile, wallets, transactions] = await Promise.all([
        getUserProfile(userId),
        getUserWallets(userId),
        getUserTransactions(userId, 10)
      ])

      console.log('✅ User data loaded successfully')
      setState(prev => ({
        ...prev,
        profile,
        wallets,
        transactions,
        dataLoading: false
      }))
    } catch (error) {
      console.error('❌ Error loading user data:', error)
      setState(prev => ({
        ...prev,
        dataLoading: false,
        wallets: [{
          id: 'fallback-ugx',
          user_id: userId,
          currency: 'UGX',
          balance: 0,
          available_balance: 0,
          locked_balance: 0,
          wallet_address: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      }))
    }
  }

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const init = async () => {
      try {
        console.log('🔐 Initializing Supabase auth...')
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()

        if (!mounted) return
        
        if (error) {
          console.error('❌ Error getting session:', error)
          setState(prev => ({ ...prev, loading: false }))
          return
        }

        console.log('📱 Initial session:', initialSession ? 'Found' : 'None')
        
        if (initialSession?.user) {
          console.log('👤 Loading data for user:', initialSession.user.id)
          await loadUserData(initialSession.user.id)
          setState(prev => ({
            ...prev,
            user: initialSession.user,
            session: initialSession,
            loading: false
          }))
        } else {
          setState(prev => ({
            ...prev,
            loading: false
          }))
        }
      } catch (err) {
        console.error('❌ Error in auth init:', err)
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false
          }))
        }
      }
    }

    // 10 second timeout
    timeoutId = setTimeout(() => {
      if (mounted && state.loading) {
        console.warn('⚠️ Auth initialization timeout')
        setState(prev => ({
          ...prev,
          loading: false
        }))
      }
    }, 10000)

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        console.log('🔄 Auth state changed:', event)
        
        if (newSession?.user) {
          await loadUserData(newSession.user.id)
          setState(prev => ({
            ...prev,
            user: newSession.user,
            session: newSession,
            loading: false
          }))
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            profile: null,
            wallets: [],
            transactions: [],
            session: null,
            loading: false
          }))
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const refreshData = async () => {
    if (state.user) {
      await loadUserData(state.user.id)
    }
  }

  return {
    ...state,
    isAuthenticated: !!state.user,
    refreshData
  }
}