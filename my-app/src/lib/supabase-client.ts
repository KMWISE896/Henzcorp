import { createClient } from '@supabase/supabase-js'

console.log('🔍 Environment variables check:')
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Found' : '❌ Missing')
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Expected variables:')
  console.error('- VITE_SUPABASE_URL')
  console.error('- VITE_SUPABASE_ANON_KEY')
  console.error('Current .env values:')
  console.error('- VITE_SUPABASE_URL:', supabaseUrl || 'undefined')
  console.error('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[HIDDEN]' : 'undefined')
  throw new Error('Missing Supabase environment variables')
}

console.log('✅ Supabase client initialized successfully')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          phone: string
          profile_image_url: string | null
          verification_status: 'pending' | 'verified' | 'rejected'
          referral_code: string
          referred_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          phone: string
          profile_image_url?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          referral_code: string
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          phone?: string
          profile_image_url?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          referral_code?: string
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          currency: string
          balance: number
          available_balance: number
          locked_balance: number
          wallet_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          currency: string
          balance?: number
          available_balance?: number
          locked_balance?: number
          wallet_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          currency?: string
          balance?: number
          available_balance?: number
          locked_balance?: number
          wallet_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'buy_crypto' | 'sell_crypto' | 'airtime_purchase'
          currency: string
          amount: number
          fee: number
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          reference_id: string
          description: string | null
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'buy_crypto' | 'sell_crypto' | 'airtime_purchase'
          currency: string
          amount: number
          fee?: number
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          reference_id?: string
          description?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: 'deposit' | 'withdrawal' | 'transfer' | 'buy_crypto' | 'sell_crypto' | 'airtime_purchase'
          currency?: string
          amount?: number
          fee?: number
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          reference_id?: string
          description?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      crypto_assets: {
        Row: {
          id: string
          symbol: string
          name: string
          current_price_ugx: number
          market_cap: number
          volume_24h: number
          price_change_24h: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          symbol: string
          name: string
          current_price_ugx?: number
          market_cap?: number
          volume_24h?: number
          price_change_24h?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          name?: string
          current_price_ugx?: number
          market_cap?: number
          volume_24h?: number
          price_change_24h?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          referral_code: string
          status: 'pending' | 'completed' | 'expired'
          reward_amount: number
          reward_currency: string
          reward_paid: boolean
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          referral_code: string
          status?: 'pending' | 'completed' | 'expired'
          reward_amount?: number
          reward_currency?: string
          reward_paid?: boolean
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          referral_code?: string
          status?: 'pending' | 'completed' | 'expired'
          reward_amount?: number
          reward_currency?: string
          reward_paid?: boolean
          created_at?: string
          completed_at?: string | null
        }
      }
    }
    Views: {
      user_dashboard: {
        Row: {
          user_id: string
          first_name: string
          last_name: string
          referral_code: string
          verification_status: string
          fiat_balance: number
          crypto_balance_ugx: number
          recent_transactions: number
          total_referrals: number
        }
      }
    }
    Functions: {
      get_user_balance: {
        Args: {
          user_uuid: string
          wallet_currency: string
        }
        Returns: number
      }
      update_wallet_balance: {
        Args: {
          user_uuid: string
          wallet_currency: string
          amount_change: number
          operation_type?: string
        }
        Returns: boolean
      }
      get_referral_stats: {
        Args: {
          user_uuid: string
        }
        Returns: {
          total_referrals: number
          total_earnings: number
          pending_earnings: number
          this_month_referrals: number
        }[]
      }
    }
  }
}