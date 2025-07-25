import { supabase } from './supabase-client'

export interface AdminUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'super_admin' | 'admin' | 'moderator' | 'support'
}

export interface AdminSession {
  token: string
  admin: AdminUser
  expires_at: string
}

class AdminAuthService {
  private static instance: AdminAuthService
  private currentSession: AdminSession | null = null

  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService()
    }
    return AdminAuthService.instance
  }

  async login(email: string, password: string): Promise<AdminSession> {
    try {
      const { data, error } = await supabase.rpc('create_admin_session', {
        admin_email: email,
        admin_password: password,
        session_ip: this.getClientIP(),
        session_user_agent: navigator.userAgent
      })

      if (error) throw error

      const result = data[0]
      if (!result.success) {
        throw new Error(result.error_message || 'Login failed')
      }

      const session: AdminSession = {
        token: result.session_token,
        admin: result.admin_data,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      this.currentSession = session
      localStorage.setItem('admin_session', JSON.stringify(session))
      
      return session
    } catch (error) {
      console.error('Admin login error:', error)
      throw error
    }
  }

  async validateSession(token?: string): Promise<AdminUser | null> {
    try {
      const sessionToken = token || this.getStoredToken()
      if (!sessionToken) return null

      const { data, error } = await supabase.rpc('validate_admin_session', {
        token: sessionToken
      })

      if (error) throw error

      const result = data[0]
      if (!result.valid) {
        this.logout()
        return null
      }

      return result.admin_data
    } catch (error) {
      console.error('Session validation error:', error)
      this.logout()
      return null
    }
  }

  logout(): void {
    this.currentSession = null
    localStorage.removeItem('admin_session')
  }

  getCurrentSession(): AdminSession | null {
    if (this.currentSession) return this.currentSession

    const stored = localStorage.getItem('admin_session')
    if (stored) {
      try {
        const session = JSON.parse(stored)
        if (new Date(session.expires_at) > new Date()) {
          this.currentSession = session
          return session
        } else {
          this.logout()
        }
      } catch (error) {
        this.logout()
      }
    }

    return null
  }

  private getStoredToken(): string | null {
    const session = this.getCurrentSession()
    return session?.token || null
  }

  private getClientIP(): string {
    // In a real app, you'd get this from the server
    return 'unknown'
  }

  isAuthenticated(): boolean {
    return this.getCurrentSession() !== null
  }

  getCurrentAdmin(): AdminUser | null {
    return this.getCurrentSession()?.admin || null
  }
}

export const adminAuth = AdminAuthService.getInstance()

// Platform statistics functions
export const getPlatformStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_platform_stats')
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching platform stats:', error)
    throw error
  }
}

// User management functions
export const getAllUsers = async (limit = 50, offset = 0) => {
  try {
    console.log('🔍 Fetching users via admin function...')
    
    // Try using the admin function first (bypasses RLS)
    const { data: adminData, error: adminError } = await supabase
      .rpc('admin_get_all_users')
    
    if (!adminError && adminData) {
      console.log('✅ Admin function succeeded:', adminData.length)
      return adminData
    }
    
    console.log('⚠️ Admin function failed, trying direct query:', adminError?.message)
    
    // Fallback to direct query
    const { data: directData, error: directError } = await supabase
      .from('user_profiles')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (directError) {
      console.error('❌ Direct query failed:', directError)
      throw new Error(`Cannot access user data. Admin function error: ${adminError?.message}, Direct query error: ${directError.message}`)
    }
    
    console.log('✅ Direct query succeeded:', directData?.length || 0)
    return directData || []
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

export const getUserDetails = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        wallets(*),
        transactions(*),
        referrals_as_referrer:referrals!referrer_id(*),
        referrals_as_referred:referrals!referred_id(*)
      `)
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user details:', error)
    throw error
  }
}

export const updateUserVerification = async (userId: string, status: 'pending' | 'verified' | 'rejected') => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ verification_status: status, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user verification:', error)
    throw error
  }
}

// Transaction management functions
export const getAllTransactions = async (limit = 50, offset = 0) => {
  try {
    console.log('🔍 Fetching transactions via admin function...')
    
    // Try using the admin function first
    const { data: adminData, error: adminError } = await supabase
      .rpc('admin_get_all_transactions')
    
    if (!adminError && adminData) {
      console.log('✅ Admin transactions function succeeded:', adminData.length)
      // Transform the data to match expected format
      return adminData.map(t => ({
        ...t,
        user_profiles: {
          first_name: t.user_first_name,
          last_name: t.user_last_name,
          email: t.user_email
        }
      }))
    }
    
    console.log('⚠️ Admin function failed, trying direct query:', adminError?.message)
    
    // Fallback to direct query
    const { data: directData, error: directError } = await supabase
      .from('transactions')
      .select(`
        *,
        user_profiles(first_name, last_name)
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (directError) {
      console.error('❌ Direct transactions query failed:', directError)
      throw new Error(`Cannot access transaction data: ${directError.message}`)
    }
    
    console.log('✅ Direct transactions query succeeded:', directData?.length || 0)
    return directData || []
  } catch (error) {
    console.error('Error fetching transactions:', error)
    throw error
  }
}

export const getTransactionDetails = async (transactionId: string) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        user_profiles(first_name, last_name, email),
        deposits(*),
        withdrawals(*),
        crypto_trades(*),
        airtime_purchases(*)
      `)
      .eq('id', transactionId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching transaction details:', error)
    throw error
  }
}