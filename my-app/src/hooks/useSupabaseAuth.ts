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
    let isMounted = true
    
    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('⚠️ Auth loading timeout - forcing completion')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    const init = async () => {
      setLoading(true)

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
        }

        if (!isMounted) return

        setSession(initialSession)
        const currentUser = initialSession?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          await loadUserProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      } catch (err) {
        console.error('Error in init:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return

        setSession(newSession)
        const newUser = newSession?.user ?? null
        setUser(newUser)

        if (newUser) {
          await loadUserProfile(newUser.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId)
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading user profile:', error)
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
