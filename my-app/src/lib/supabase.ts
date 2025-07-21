// Mock data and types for the app without database connection

// Local storage keys
const STORAGE_KEYS = {
  CURRENT_USER: 'henzcorp_current_user',
  USER_PROFILES: 'henzcorp_user_profiles',
  USER_WALLETS: 'henzcorp_user_wallets',
  USER_TRANSACTIONS: 'henzcorp_user_transactions',
  SAVED_PHONE_NUMBERS: 'henzcorp_saved_phone_numbers',
  USER_PREFERENCES: 'henzcorp_user_preferences',
  APP_SETTINGS: 'henzcorp_app_settings',
  SESSION_TIMESTAMP: 'henzcorp_session_timestamp'
}

export interface UserProfile {
  id: string
  email?: string
  first_name: string
  last_name: string
  phone: string
  profile_image_url?: string
  verification_status: 'pending' | 'verified' | 'rejected'
  referral_code: string
  referred_by?: string
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  currency: string
  balance: number
  available_balance: number
  locked_balance: number
  wallet_address?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'buy_crypto' | 'sell_crypto' | 'airtime_purchase'
  currency: string
  amount: number
  fee: number
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  reference_id: string
  description?: string
  metadata: any
  created_at: string
  updated_at: string
}

export interface CryptoAsset {
  id: string
  symbol: string
  name: string
  current_price_ugx: number
  market_cap: number
  volume_24h: number
  price_change_24h: number
  is_active: boolean
  updated_at: string
}

// Utility functions for local storage
const getStoredData = (key: string, defaultValue: any = null) => {
  try {
    // Check if data has expired (for test purposes - 24 hours)
    if (key !== STORAGE_KEYS.SESSION_TIMESTAMP) {
      checkAndCleanExpiredData()
    }
    
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    console.warn(`Failed to parse stored data for key: ${key}`)
    return defaultValue
  }
}

const setStoredData = (key: string, data: any) => {
  try {
    // Set session timestamp for auto-cleanup
    if (key === STORAGE_KEYS.CURRENT_USER && data) {
      localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString())
    }
    
    localStorage.setItem(key, JSON.stringify(data))
    console.log(`✅ Data stored successfully for key: ${key}`, data)
  } catch (error) {
    console.error(`Failed to store data for key ${key}:`, error)
  }
}

// Auto-cleanup for test purposes (24 hours)
const checkAndCleanExpiredData = () => {
  try {
    const sessionTimestamp = localStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP)
    if (sessionTimestamp) {
      const sessionTime = parseInt(sessionTimestamp)
      const now = Date.now()
      const twentyFourHours = 24 * 60 * 60 * 1000
      
      if (now - sessionTime > twentyFourHours) {
        console.log('🧹 Auto-cleaning expired test data (24+ hours old)')
        clearAllStoredData()
        // Reset timestamp
        localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, now.toString())
      }
    }
  } catch (error) {
    console.warn('Failed to check expired data:', error)
  }
}

// Clear all app data (useful for reset)
const clearAllStoredData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
  console.log('🗑️ All app data cleared from local storage')
}

// Get storage usage info
const getStorageInfo = () => {
  const data = {}
  let totalSize = 0
  
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const stored = localStorage.getItem(key)
    const size = stored ? new Blob([stored]).size : 0
    data[name] = {
      key,
      size: `${(size / 1024).toFixed(2)} KB`,
      exists: !!stored
    }
    totalSize += size
  })
  
  return {
    individual: data,
    totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
    available: typeof navigator !== 'undefined' && 'storage' in navigator
  }
}
// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9)
const generateReferralCode = () => `HENZ2024${Math.random().toString(36).substr(2, 6).toUpperCase()}`
const generateTransactionRef = () => `TXN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

// Initialize default data if not exists
const initializeDefaultData = () => {
  console.log('🚀 Initializing default data...')
  
  // Initialize user profiles if empty
  const profiles = getStoredData(STORAGE_KEYS.USER_PROFILES, {})
  if (Object.keys(profiles).length === 0) {
    console.log('👤 Creating demo user profile...')
    // Create demo user
    const demoUserId = '550e8400-e29b-41d4-a716-446655440000'
    profiles[demoUserId] = {
      id: demoUserId,
      email: 'demo@henzcorp.com',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+256700123456',
      verification_status: 'verified',
      referral_code: 'HENZ2024DEMO01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setStoredData(STORAGE_KEYS.USER_PROFILES, profiles)
    
    console.log('💰 Creating demo wallets...')
    // Create demo wallets
    const wallets = {}
    wallets[demoUserId] = [
      {
        id: '1',
        user_id: demoUserId,
        currency: 'UGX',
        balance: 1000000,
        available_balance: 950000,
        locked_balance: 50000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        user_id: demoUserId,
        currency: 'BTC',
        balance: 0.01,
        available_balance: 0.01,
        locked_balance: 0,
        wallet_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        user_id: demoUserId,
        currency: 'ETH',
        balance: 0.5,
        available_balance: 0.5,
        locked_balance: 0,
        wallet_address: '0x742d35Cc6634C0532925a3b8D4C9db96590b5c8e',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    setStoredData(STORAGE_KEYS.USER_WALLETS, wallets)
    
    console.log('📊 Creating demo transactions...')
    // Create demo transactions
    const transactions = {}
    transactions[demoUserId] = [
      {
        id: '1',
        user_id: demoUserId,
        transaction_type: 'deposit',
        currency: 'UGX',
        amount: 500000,
        fee: 5000,
        status: 'completed',
        reference_id: 'TXN20240118001',
        description: 'Deposit via MTN Mobile Money',
        metadata: {},
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        user_id: demoUserId,
        transaction_type: 'buy_crypto',
        currency: 'BTC',
        amount: 0.005,
        fee: 3000,
        status: 'completed',
        reference_id: 'TXN20240118002',
        description: 'Buy 0.005 BTC',
        metadata: {},
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
    setStoredData(STORAGE_KEYS.USER_TRANSACTIONS, transactions)
    
    console.log('✅ Demo data initialized successfully!')
  } else {
    console.log('📋 Existing data found, skipping initialization')
  }
}

// Initialize on load
initializeDefaultData()

const mockCryptoAssets: CryptoAsset[] = [
  {
    id: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    current_price_ugx: 165420000,
    market_cap: 3200000000000,
    volume_24h: 890000000000,
    price_change_24h: 2.45,
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    symbol: 'ETH',
    name: 'Ethereum',
    current_price_ugx: 8750000,
    market_cap: 1100000000000,
    volume_24h: 420000000000,
    price_change_24h: 1.82,
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    symbol: 'USDT',
    name: 'Tether',
    current_price_ugx: 3700,
    market_cap: 340000000000,
    volume_24h: 1200000000000,
    price_change_24h: 0.01,
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    symbol: 'LTC',
    name: 'Litecoin',
    current_price_ugx: 380000,
    market_cap: 110000000000,
    volume_24h: 45000000000,
    price_change_24h: -0.75,
    is_active: true,
    updated_at: new Date().toISOString()
  }
]

// Current session management
let currentSession: { user: any; session: any } | null = getStoredData(STORAGE_KEYS.CURRENT_USER)

// Auth state change listeners
const authListeners: ((event: string, session: any) => void)[] = []

// Mock authentication functions
export const signUp = async (email: string, password: string, userData: {
  firstName: string
  lastName: string
  phone: string
  referralCode?: string
}) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Check if user already exists
  const profiles = getStoredData(STORAGE_KEYS.USER_PROFILES, {})
  const existingUser = Object.values(profiles).find((profile: any) => 
    profile.email?.toLowerCase() === email.toLowerCase()
  )
  
  if (existingUser) {
    const error = new Error('An account with this email address already exists. Please use a different email or try logging in.')
    error.name = 'DuplicateEmailError'
    throw error
  }
  
  // Create new user
  const userId = generateId()
  
  // Create user profile
  const newProfile: UserProfile = {
    id: userId,
    email: email.toLowerCase().trim(),
    first_name: userData.firstName,
    last_name: userData.lastName,
    phone: userData.phone,
    verification_status: 'pending',
    referral_code: generateReferralCode(),
    referred_by: userData.referralCode ? findUserByReferralCode(userData.referralCode)?.id : undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  // Store user profile
  profiles[userId] = newProfile
  setStoredData(STORAGE_KEYS.USER_PROFILES, profiles)
  
  // Create initial wallet (UGX)
  const wallets = getStoredData(STORAGE_KEYS.USER_WALLETS, {})
  wallets[userId] = [
    {
      id: generateId(),
      user_id: userId,
      currency: 'UGX',
      balance: 0,
      available_balance: 0,
      locked_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
  setStoredData(STORAGE_KEYS.USER_WALLETS, wallets)
  
  // Initialize empty transactions
  const transactions = getStoredData(STORAGE_KEYS.USER_TRANSACTIONS, {})
  transactions[userId] = []
  setStoredData(STORAGE_KEYS.USER_TRANSACTIONS, transactions)
  
  // Set current session
  const newUser = { id: userId, email }
  currentSession = { user: newUser, session: { user: newUser } }
  setStoredData(STORAGE_KEYS.CURRENT_USER, currentSession)
  
  // Notify listeners
  authListeners.forEach(listener => listener('SIGNED_UP', currentSession))
  
  return currentSession
}

export const signIn = async (email: string, password: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Normalize email for comparison
  const normalizedEmail = email.toLowerCase().trim()
  
  // Handle demo account
  if (normalizedEmail === 'demo@henzcorp.com' && password === 'demo123') {
    const demoUserId = '550e8400-e29b-41d4-a716-446655440000'
    const user = { id: demoUserId, email: normalizedEmail }
    currentSession = { user, session: { user } }
    setStoredData(STORAGE_KEYS.CURRENT_USER, currentSession)
    
    // Notify listeners
    authListeners.forEach(listener => listener('SIGNED_IN', currentSession))
    return currentSession
  }
  
  // Find user by email
  const profiles = getStoredData(STORAGE_KEYS.USER_PROFILES, {})
  const userProfile = Object.values(profiles).find((profile: any) => 
    profile.email?.toLowerCase() === normalizedEmail
  )
  
  if (!userProfile) {
    const error = new Error('No account found with this email address. Please check your email or sign up for a new account.')
    error.name = 'UserNotFoundError'
    throw error
  }
  
  // Create session
  const user = { id: (userProfile as any).id, email: normalizedEmail }
  currentSession = { user, session: { user } }
  setStoredData(STORAGE_KEYS.CURRENT_USER, currentSession)
  
  // Notify listeners
  authListeners.forEach(listener => listener('SIGNED_IN', currentSession))
  
  return currentSession
}

export const signOut = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  currentSession = null
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  
  // Notify listeners
  authListeners.forEach(listener => listener('SIGNED_OUT', null))
}

// Helper function to find user by referral code
const findUserByReferralCode = (referralCode: string) => {
  const profiles = getStoredData(STORAGE_KEYS.USER_PROFILES, {})
  return Object.values(profiles).find((profile: any) => profile.referral_code === referralCode)
}

// Mock user profile functions
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const profiles = getStoredData(STORAGE_KEYS.USER_PROFILES, {})
  const profile = profiles[userId]
  
  if (!profile) {
    throw new Error('User profile not found')
  }
  
  return profile
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const profiles = getStoredData(STORAGE_KEYS.USER_PROFILES, {})
  if (profiles[userId]) {
    profiles[userId] = { ...profiles[userId], ...updates, updated_at: new Date().toISOString() }
    setStoredData(STORAGE_KEYS.USER_PROFILES, profiles)
  }
  
  return profiles[userId]
}

// Mock wallet functions
export const getUserWallets = async (userId: string): Promise<Wallet[]> => {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const wallets = getStoredData(STORAGE_KEYS.USER_WALLETS, {})
  return wallets[userId] || []
}

export const getWalletBalance = async (userId: string, currency: string): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const wallets = getStoredData(STORAGE_KEYS.USER_WALLETS, {})
  const userWallets = wallets[userId] || []
  const wallet = userWallets.find((w: Wallet) => w.currency === currency)
  return wallet?.available_balance || 0 
}

export const updateWalletBalance = async (
  userId: string,
  currency: string,
  amount: number,
  operation: 'add' | 'subtract' = 'add'
) => {
  await new Promise(resolve => setTimeout(resolve, 100)) // Faster for better UX
  
  const wallets = getStoredData(STORAGE_KEYS.USER_WALLETS, {})
  const userWallets = wallets[userId] || []
  
  let wallet = userWallets.find((w: Wallet) => w.currency === currency)
  
  // Create wallet if it doesn't exist
  if (!wallet) {
    console.log(`Creating new ${currency} wallet for user ${userId}`)
    wallet = {
      id: generateId(),
      user_id: userId,
      currency,
      balance: 0,
      available_balance: 0,
      locked_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    userWallets.push(wallet)
  }
  
  const oldBalance = wallet.available_balance
  
  // Update balance
  if (operation === 'add') {
    wallet.available_balance += amount
    console.log(`💰 Added ${amount} ${currency} to wallet`)
  } else {
    wallet.available_balance -= amount
    console.log(`💸 Subtracted ${amount} ${currency} from wallet`)
    // Prevent negative balances
    if (wallet.available_balance < 0) {
      console.warn(`❌ Insufficient balance for ${currency} wallet. Required: ${amount}, Available: ${oldBalance}`)
      wallet.available_balance = oldBalance // Revert
      throw new Error(`Insufficient ${currency} balance`)
    }
  }
  wallet.balance = wallet.available_balance
  wallet.updated_at = new Date().toISOString()
  
  // Save updated wallets
  wallets[userId] = userWallets
  setStoredData(STORAGE_KEYS.USER_WALLETS, wallets)
  
  console.log(`🔄 ${currency} wallet updated: ${oldBalance} → ${wallet.available_balance} (${operation} ${amount})`)
  console.log(`💾 Wallet data saved to localStorage:`, wallet)
  
  return wallet
}

// Mock transaction functions
export const createTransaction = async (transactionData: any): Promise<Transaction> => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const newTransaction: Transaction = {
    id: generateId(),
    ...transactionData,
    status: 'pending',
    reference_id: generateTransactionRef(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  // Store transaction
  const transactions = getStoredData(STORAGE_KEYS.USER_TRANSACTIONS, {})
  if (!transactions[transactionData.user_id]) {
    transactions[transactionData.user_id] = []
  }
  transactions[transactionData.user_id].unshift(newTransaction)
  
  // Keep only last 100 transactions per user to prevent storage bloat
  if (transactions[transactionData.user_id].length > 100) {
    transactions[transactionData.user_id] = transactions[transactionData.user_id].slice(0, 100)
  }
  
  setStoredData(STORAGE_KEYS.USER_TRANSACTIONS, transactions)
  
  console.log(`📝 Transaction created: ${newTransaction.reference_id}`, newTransaction)
  
  return newTransaction
}

export const getUserTransactions = async (userId: string, limit = 10): Promise<Transaction[]> => {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const transactions = getStoredData(STORAGE_KEYS.USER_TRANSACTIONS, {})
  const userTransactions = transactions[userId] || []
  return userTransactions.slice(0, limit)
}

export const updateTransactionStatus = async (transactionId: string, status: Transaction['status']) => {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const transactions = getStoredData(STORAGE_KEYS.USER_TRANSACTIONS, {})
  
  // Find and update transaction across all users
  for (const userId in transactions) {
    const userTransactions = transactions[userId]
    const transaction = userTransactions.find((t: Transaction) => t.id === transactionId)
    if (transaction) {
      const oldStatus = transaction.status
      transaction.status = status
      transaction.updated_at = new Date().toISOString()
      setStoredData(STORAGE_KEYS.USER_TRANSACTIONS, transactions)
      console.log(`🔄 Transaction ${transaction.reference_id} status: ${oldStatus} → ${status}`)
      return transaction
    }
  }
  
  console.warn(`❌ Transaction not found: ${transactionId}`)
  return null
}

// Mock deposit/withdrawal functions
export const createDeposit = async (depositData: any) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return { id: generateId(), ...depositData }
}

export const createWithdrawal = async (withdrawalData: any) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return { id: generateId(), ...withdrawalData }
}

// Mock airtime functions
export const createAirtimePurchase = async (airtimeData: any) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return { id: generateId(), ...airtimeData }
}

// Mock crypto functions
export const getCryptoAssets = async (): Promise<CryptoAsset[]> => {
  await new Promise(resolve => setTimeout(resolve, 500))
  return mockCryptoAssets
}

export const createCryptoTrade = async (tradeData: any) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return { id: generateId(), ...tradeData }
}

export const createCryptoTransfer = async (transferData: any) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return { id: generateId(), ...transferData }
}

// Mock referral functions
export const getReferralStats = async (userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 500))
  return [{
    total_referrals: 3,
    total_earnings: 60000,
    pending_earnings: 20000,
    this_month_referrals: 1
  }]
}

export const getUserReferrals = async (userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 500))
  return [
    {
      id: '1',
      referrer_id: userId,
      referred_id: '2',
      referral_code: 'HENZ2024TEST01',
      status: 'completed',
      reward_amount: 20000,
      reward_currency: 'UGX',
      reward_paid: true,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      referred: {
        first_name: 'Jane',
        last_name: 'Smith',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ]
}

// Utility functions
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('256')) {
    return `+${cleaned}`
  }
  if (cleaned.startsWith('0')) {
    return `+256${cleaned.substring(1)}`
  }
  if (cleaned.length === 9) {
    return `+256${cleaned}`
  }
  return `+${cleaned}`
}

// Phone number storage functions
export const savePhoneNumber = (userId: string, phoneNumber: string, type: 'deposit' | 'withdrawal' | 'airtime' = 'deposit') => {
  try {
    const savedNumbers = getStoredData(STORAGE_KEYS.SAVED_PHONE_NUMBERS, {})
    if (!savedNumbers[userId]) {
      savedNumbers[userId] = {}
    }
    
    // Store the phone number for the specific type
    savedNumbers[userId][type] = {
      phoneNumber: formatPhoneNumber(phoneNumber),
      lastUsed: new Date().toISOString()
    }
    
    setStoredData(STORAGE_KEYS.SAVED_PHONE_NUMBERS, savedNumbers)
    console.log(`📱 Saved phone number for ${type}:`, phoneNumber)
  } catch (error) {
    console.error('Error saving phone number:', error)
  }
}

export const getSavedPhoneNumber = (userId: string, type: 'deposit' | 'withdrawal' | 'airtime' = 'deposit'): string | null => {
  try {
    const savedNumbers = getStoredData(STORAGE_KEYS.SAVED_PHONE_NUMBERS, {})
    return savedNumbers[userId]?.[type]?.phoneNumber || null
  } catch (error) {
    console.error('Error getting saved phone number:', error)
    return null
  }
}

export const getAllSavedPhoneNumbers = (userId: string) => {
  try {
    const savedNumbers = getStoredData(STORAGE_KEYS.SAVED_PHONE_NUMBERS, {})
    return savedNumbers[userId] || {}
  } catch (error) {
    console.error('Error getting all saved phone numbers:', error)
    return {}
  }
}

export const detectNetwork = (phone: string): 'mtn' | 'airtel' | 'utl' => {
  const cleaned = phone.replace(/\D/g, '')
  const lastDigits = cleaned.slice(-9)
  
  if (lastDigits.startsWith('77') || lastDigits.startsWith('78') || 
      lastDigits.startsWith('76') || lastDigits.startsWith('39')) {
    return 'mtn'
  }
  
  if (lastDigits.startsWith('75') || lastDigits.startsWith('70') || 
      lastDigits.startsWith('74') || lastDigits.startsWith('20')) {
    return 'airtel'
  }
  
  if (lastDigits.startsWith('71') || lastDigits.startsWith('31')) {
    return 'utl'
  }
  
  return 'mtn'
}

// Mock supabase object for compatibility
export const supabase = {
  auth: {
    getSession: async () => ({ 
      data: { 
        session: currentSession?.session || null 
      } 
    }),
    onAuthStateChange: (callback: any) => {
      // Add listener
      authListeners.push(callback)
      
      // Call immediately with current state
      setTimeout(() => {
        if (currentSession) {
          callback('SIGNED_IN', currentSession.session)
        } else {
          callback('SIGNED_OUT', null)
        }
      }, 100)
      
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              const index = authListeners.indexOf(callback)
              if (index > -1) {
                authListeners.splice(index, 1)
              }
            } 
          } 
        } 
      }
    }
  }
}

// Export utility functions for debugging/admin
export const storageUtils = {
  getStorageInfo,
  clearAllStoredData,
  getStoredData,
  setStoredData,
  STORAGE_KEYS
}