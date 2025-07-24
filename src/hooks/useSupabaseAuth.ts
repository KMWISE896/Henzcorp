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
    let mounted = true

    const init = async () => {
      try {
        console.log('🔐 Initializing Supabase auth...')
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Error getting session:', error)
          if (mounted) {
            setLoading(false)
          }
          return
        }

        if (!mounted) return

        console.log('📱 Initial session:', initialSession ? 'Found' : 'None')
        setSession(initialSession)
        const currentUser = initialSession?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          console.log('👤 Loading profile for user:', currentUser.id)
          await loadUserProfile(currentUser.id)
        } else {
          console.log('🚫 No user found')
          setProfile(null)
        }
      } catch (err) {
        console.error('❌ Error in auth init:', err)
      } finally {
        if (mounted) {
          console.log('✅ Auth initialization complete')
          setLoading(false)
        }
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return

        console.log('🔄 Auth state changed:', event, newSession ? 'Session exists' : 'No session')
        setSession(newSession)
        const newUser = newSession?.user ?? null
        setUser(newUser)

        if (newUser) {
          console.log('👤 Auth state change - loading profile for:', newUser.id)
          await loadUserProfile(newUser.id)
        } else {
          console.log('🚫 Auth state change - no user')
          setProfile(null)
        }

        if (mounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('📊 Fetching user profile...')
      const userProfile = await getUserProfile(userId)
      console.log('✅ Profile loaded:', userProfile ? 'Success' : 'Not found')
      setProfile(userProfile)
    } catch (error) {
      console.error('❌ Error loading user profile:', error)
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 Refreshing profile...')
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
