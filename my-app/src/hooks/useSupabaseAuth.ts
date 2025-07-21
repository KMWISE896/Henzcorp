import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase-client'
import { getUserProfile, type UserProfile } from '../lib/database'
import type { User, Session } from '@supabase/supabase-js'

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        
        if (initialSession?.user) {
          await loadUserProfile(initialSession.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId)
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading user profile:', error)
      // If profile doesn't exist, user might need to complete signup
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id)
    }
  }

  return {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!user,
    refreshProfile
  }
}