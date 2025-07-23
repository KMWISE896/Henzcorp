import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase-client'
import { getUserProfile, type UserProfile } from '../lib/database'
import type { User, Session } from '@supabase/supabase-js'

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (initialSession) {
          console.log('✅ Initial session found:', initialSession.user.id)
          setSession(initialSession)
          setUser(initialSession.user)
          await loadUserProfile(initialSession.user.id)
        } else {
          console.log('ℹ️ No active session found')
        }
      } catch (err) {
        console.error('❌ Error getting session:', err)
      } finally {
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('🔄 Auth state changed:', _event, newSession?.user?.id)
        setSession(newSession)
        const newUser = newSession?.user ?? null
        setUser(newUser)

        if (newUser) {
          await loadUserProfile(newUser.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId)
      if (userProfile) {
        setProfile(userProfile)
      } else {
        console.warn('⚠️ No profile found for user ID:', userId)
        setProfile(null)
      }
    } catch (err) {
      console.error('❌ Failed to load user profile:', err)
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
    refreshProfile,
  }
}
