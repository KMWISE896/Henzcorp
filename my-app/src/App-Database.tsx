import React, { useState, useEffect } from 'react'
import { Home, ArrowUpDown, Plus, Minus, Smartphone, Users, User } from 'lucide-react'
import { supabase } from './lib/supabase-client'
import { useAlert } from './hooks/useAlert'

// Import screens
import LoginScreen from './components/LoginScreen'
import SignupScreen from './components/SignupScreen'
import DepositScreen from './components/DepositScreen'
import WithdrawScreen from './components/WithdrawScreen'
import AirtimeScreen from './components/AirtimeScreen'
import BuyCryptoScreen from './components/BuyCryptoScreen'
import TransferScreen from './components/TransferScreen'
import ReferralScreen from './components/ReferralScreen'
import AccountScreen from './components/AccountScreen'
import BottomNavigation from './components/BottomNavigation'
import AlertContainer from './components/AlertContainer'

// Import database functions
import { 
  signIn as dbSignIn, 
  signUp as dbSignUp, 
  signOut as dbSignOut,
  getUserProfile,
  getUserWallets,
  getUserTransactions,
  type UserProfile,
  type Wallet,
  type Transaction
} from './lib/database'

type Screen = 'home' | 'deposit' | 'withdraw' | 'airtime' | 'buy-crypto' | 'transfer' | 'referral' | 'account'

interface AppState {
  user: any | null
  profile: UserProfile | null
  wallets: Wallet[]
  transactions: Transaction[]
  isAuthenticated: boolean
  loading: boolean
  dataLoading: boolean
}

export default function AppDatabase() {
  const { alerts, hideAlert, showSuccess, showError, showWarning, showInfo } = useAlert()
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [showLogin, setShowLogin] = useState(true)
  const [appState, setAppState] = useState<AppState>({
    user: null,
    profile: null,
    wallets: [],
    transactions: [],
    isAuthenticated: false,
    loading: true,
    dataLoading: false
  })

  // Initialize app state
  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    console.log('🚀 Initializing app...')
    
    try {
      // Check if we have a stored session
      const storedUser = localStorage.getItem('henzcorp_current_user')
      
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        console.log('📱 Found stored session:', userData)
        
        setAppState(prev => ({
          ...prev,
          user: userData.user,
          isAuthenticated: true,
          loading: false
        }))
        
        // Load user data
        await loadUserData(userData.user.id)
      } else {
        console.log('🔍 No stored session found')
        setAppState(prev => ({
          ...prev,
          loading: false
        }))
      }
    } catch (error) {
      console.error('❌ Error initializing app:', error)
      setAppState(prev => ({
        ...prev,
        loading: false
      }))
    }
  }

  const loadUserData = async (userId: string) => {
    console.log('📊 Loading user data for:', userId)
    setAppState(prev => ({ ...prev, dataLoading: true }))
    
    try {
      // Load profile
      const profile = await getUserProfile(userId)
      console.log('👤 Profile loaded:', profile)
      
      // Load wallets
      const wallets = await getUserWallets(userId)
      console.log('💰 Wallets loaded:', wallets.length)
      
      // Load transactions
      const transactions = await getUserTransactions(userId, 10)
      console.log('📋 Transactions loaded:', transactions.length)
      
      setAppState(prev => ({
        ...prev,
        profile,
        wallets,
        transactions,
        dataLoading: false
      }))
    } catch (error) {
      console.error('❌ Error loading user data:', error)
      
      // Provide fallback data
      setAppState(prev => ({
        ...prev,
        profile: null,
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
        }],
        transactions: [],
        dataLoading: false
      }))
    }
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login...')
      const result = await dbSignIn(email, password)
      
      setAppState(prev => ({
        ...prev,
        user: result.user,
        isAuthenticated: true
      }))
      
      await loadUserData(result.user.id)
      showSuccess('Welcome back!', 'You have successfully logged in.')
    } catch (error: any) {
      console.error('❌ Login error:', error)
      showError('Login Failed', error.message || 'Please check your credentials.')
      throw error
    }
  }

  const handleSignup = async (email: string, password: string, userData: any) => {
    try {
      console.log('📝 Attempting signup...')
      const result = await dbSignUp(email, password, userData)
      
      // Show success message and redirect to login
      showSuccess('Account Created!', 'Please log in with your new account.')
      
      // Redirect to login screen after successful signup
      setTimeout(() => {
        setShowLogin(true)
      }, 2000) // Give time for success message to be seen
      
    } catch (error: any) {
      console.error('❌ Signup error:', error)
      showError('Signup Failed', error.message || 'Please try again.')
      throw error
    }
  }

  const handleLogout = async () => {
    console.log('🚪 Logging out...')
    
    try {
      // Clear all storage first to prevent any race conditions
      console.log('🗑️ Clearing all storage...')
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear any HenzCorp specific storage keys
      const keysToRemove = [
        'henzcorp_current_user',
        'henzcorp_session',
        'henzcorp_auth_token',
        'supabase.auth.token',
        'sb-xdouqtbiohhfpwjqkqbv-auth-token'
      ]
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        } catch (e) {
          // Ignore errors for keys that don't exist
        }
      })
      
      // Sign out from Supabase
      console.log('🔐 Signing out from Supabase...')
      await supabase.auth.signOut({ scope: 'global' })
      console.log('✅ Supabase logout successful')
      
    } catch (error) {
      console.warn('⚠️ Supabase logout error (continuing anyway):', error)
    }
    
    // Force clear all app state
    console.log('🧹 Clearing all app state...')
    setAppState({
      user: null,
      profile: null,
      wallets: [],
      transactions: [],
      isAuthenticated: false,
      loading: false,
      dataLoading: false
    })
    
    // Double-check storage is cleared
    localStorage.clear()
    sessionStorage.clear()
    
    // Reset UI to login screen
    console.log('🔄 Resetting to login screen...')
    setShowLogin(true)
    setCurrentScreen('home')
    
    // Force page reload to ensure clean state (optional but thorough)
    setTimeout(() => {
      window.location.reload()
    }, 100)
    
    console.log('✅ Logout completed')
  }

  const refreshData = async () => {
    if (appState.user) {
      await loadUserData(appState.user.id)
    }
  }

  const getFiatBalance = (): number => {
    const wallet = appState.wallets.find(w => w.currency === 'UGX')
    return wallet?.available_balance || 0
  }

  const getCryptoBalanceUGX = (): number => {
    const conversionRates: { [key: string]: number } = {
      'BTC': 165420000,
      'ETH': 8750000,
      'LTC': 380000,
      'USDT': 3700
    }
    
    return appState.wallets
      .filter(w => w.currency !== 'UGX')
      .reduce((sum, wallet) => {
        const rate = conversionRates[wallet.currency] || 1
        return sum + (wallet.available_balance * rate)
      }, 0)
  }

  const getWalletBalance = (currency: string): number => {
    const wallet = appState.wallets.find(w => w.currency === currency)
    return wallet?.available_balance || 0
  }

  // Show loading screen with timeout
  if (appState.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-purple-500 border-r-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-white mb-4">Loading...</p>
          <p className="text-gray-400 text-sm mb-6">Connecting to Supabase...</p>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
          >
            Skip to Login
          </button>
        </div>
      </div>
    )
  }

  // Show auth screens if not authenticated
  if (!appState.isAuthenticated) {
    return showLogin ? (
      <>
        <LoginScreen 
          onLogin={() => {}}
          onLoginSubmit={handleLogin}
          onSwitchToSignup={() => setShowLogin(false)}
          showAlert={{ showSuccess, showError, showWarning, showInfo }}
        />
        <AlertContainer alerts={alerts} onClose={hideAlert} />
      </>
    ) : (
      <>
        <SignupScreen 
          onSignup={() => {}}
          onSignupSubmit={handleSignup}
          onSwitchToLogin={() => setShowLogin(true)}
          showAlert={{ showSuccess, showError, showWarning, showInfo }}
        />
        <AlertContainer alerts={alerts} onClose={hideAlert} />
      </>
    )
  }

  // Render different screens
  const renderScreen = () => {
    const screenProps = {
      user: appState.user,
      profile: appState.profile,
      wallets: appState.wallets,
      transactions: appState.transactions,
      getFiatBalance,
      getCryptoBalanceUGX,
      getWalletBalance,
      refreshData,
      showAlert: { showSuccess, showError, showWarning, showInfo }
    }

    switch (currentScreen) {
      case 'deposit':
        return (
          <>
            <DepositScreen 
              onBack={() => setCurrentScreen('home')} 
              onSuccess={refreshData}
              showAlert={{ showSuccess, showError, showWarning, showInfo }}
            />
            <BottomNavigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
            <AlertContainer alerts={alerts} onClose={hideAlert} />
          </>
        )
      case 'withdraw':
        return (
          <>
            <WithdrawScreen 
              onBack={() => setCurrentScreen('home')} 
              onSuccess={refreshData}
              showAlert={{ showSuccess, showError, showWarning, showInfo }}
            />
            <BottomNavigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
            <AlertContainer alerts={alerts} onClose={hideAlert} />
          </>
        )
      case 'airtime':
        return (
          <>
            <AirtimeScreen 
              onBack={() => setCurrentScreen('home')} 
              onSuccess={refreshData}
              showAlert={{ showSuccess, showError, showWarning, showInfo }}
            />
            <BottomNavigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
            <AlertContainer alerts={alerts} onClose={hideAlert} />
          </>
        )
      case 'buy-crypto':
        return (
          <>
            <BuyCryptoScreen 
              onBack={() => setCurrentScreen('home')} 
              onSuccess={refreshData}
              showAlert={{ showSuccess, showError, showWarning, showInfo }}
            />
            <BottomNavigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
            <AlertContainer alerts={alerts} onClose={hideAlert} />
          </>
        )
      case 'transfer':
        return (
          <>
            <TransferScreen 
              onBack={() => setCurrentScreen('home')} 
              onSuccess={refreshData}
              showAlert={{ showSuccess, showError, showWarning, showInfo }}
            />
            <BottomNavigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
            <AlertContainer alerts={alerts} onClose={hideAlert} />
          </>
        )
      case 'referral':
        return (
          <>
            <ReferralScreen 
              onBack={() => setCurrentScreen('home')} 
              showAlert={{ showSuccess, showError, showWarning, showInfo }}
            />
            <BottomNavigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
            <AlertContainer alerts={alerts} onClose={hideAlert} />
          </>
        )
      case 'account':
        return (
          <>
            <AccountScreen 
              onBack={() => setCurrentScreen('home')} 
              onLogout={handleLogout}
              showAlert={{ showSuccess, showError, showWarning, showInfo }}
            />
            <BottomNavigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
            <AlertContainer alerts={alerts} onClose={hideAlert} />
          </>
        )
      default:
        return (
          <>
            {renderHomeScreen()}
            <AlertContainer alerts={alerts} onClose={hideAlert} />
          </>
        )
    }
  }

  const renderHomeScreen = () => {
    const fiatBalance = getFiatBalance()
    const cryptoBalance = getCryptoBalanceUGX()
    const totalBalance = fiatBalance + cryptoBalance
    
    const formatTransactionForDisplay = (transaction: any) => {
      const getIcon = () => {
        switch (transaction.transaction_type) {
          case 'deposit': return 'D'
          case 'withdrawal': return 'W'
          case 'buy_crypto': return 'B'
          case 'sell_crypto': return 'S'
          case 'transfer': return 'T'
          case 'airtime_purchase': return 'A'
          default: return 'T'
        }
      }

      const getIconColor = () => {
        switch (transaction.status) {
          case 'completed': return 'bg-green-500'
          case 'pending': return 'bg-yellow-500'
          case 'failed': return 'bg-red-500'
          case 'cancelled': return 'bg-gray-500'
          default: return 'bg-blue-500'
        }
      }

      const getTitle = () => {
        switch (transaction.transaction_type) {
          case 'deposit': return 'You deposited funds'
          case 'withdrawal': return 'You withdrew funds'
          case 'buy_crypto': return `You bought ${transaction.currency}`
          case 'sell_crypto': return `You sold ${transaction.currency}`
          case 'transfer': return `You sent ${transaction.currency}`
          case 'airtime_purchase': return 'You purchased Airtime'
          default: return 'Transaction'
        }
      }

      return {
        id: transaction.id,
        type: transaction.transaction_type,
        title: getTitle(),
        amount: `${transaction.currency} ${transaction.amount.toLocaleString()}`,
        description: transaction.description || '',
        time: new Date(transaction.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        }),
        icon: getIcon(),
        iconColor: getIconColor(),
        status: transaction.status
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white pb-20">
        {/* Header */}
        <div className="px-6 pt-12 pb-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-white text-lg">
                Welcome back, {appState.profile?.first_name || 'User'}!
              </h2>
              <p className="text-blue-300 text-sm">
                {appState.profile?.verification_status === 'verified' ? '✓ Verified Account' : 'Pending Verification'}
              </p>
            </div>
            <button 
              onClick={() => setCurrentScreen('account')}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Balance Cards */}
          <div className="space-y-4 mb-8">
            {/* Total Balance */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
              <p className="text-blue-300 text-sm mb-2">Total Balance</p>
              <div className="text-white text-3xl font-bold mb-4">
                {appState.dataLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <span key={`${fiatBalance}-${cryptoBalance}`}>
                    UGX {totalBalance.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs">Fiat Balance</p>
                  <p className="text-white font-semibold" key={fiatBalance}>
                    UGX {fiatBalance.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Crypto Balance</p>
                  <p className="text-white font-semibold" key={cryptoBalance}>
                    UGX {cryptoBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setCurrentScreen('deposit')}
              className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-2xl p-4 border border-green-500/30 hover:bg-green-600/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Deposit</p>
                  <p className="text-green-300 text-sm">Add funds</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setCurrentScreen('withdraw')}
              className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30 hover:bg-red-600/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <Minus className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Withdraw</p>
                  <p className="text-red-300 text-sm">Cash out</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setCurrentScreen('buy-crypto')}
              className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-sm rounded-2xl p-4 border border-orange-500/30 hover:bg-orange-600/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">₿</span>
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Buy Crypto</p>
                  <p className="text-orange-300 text-sm">Invest now</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setCurrentScreen('airtime')}
              className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30 hover:bg-purple-600/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Airtime</p>
                  <p className="text-purple-300 text-sm">Top up</p>
                </div>
              </div>
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="mb-8">
            <h3 className="text-white font-semibold text-lg mb-4">Recent Transactions</h3>
            {appState.dataLoading ? (
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-blue-800/30 text-center">
                <div className="relative mx-auto mb-2">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-6 h-6 border-2 border-purple-500 border-r-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
                </div>
                <p className="text-gray-400 text-sm">Loading transactions...</p>
              </div>
            ) : appState.transactions.length > 0 ? (
              <div className="space-y-3">
                {appState.transactions.slice(0, 5).map((transaction) => {
                  const formatted = formatTransactionForDisplay(transaction)
                  return (
                    <div key={formatted.id} className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${formatted.iconColor} rounded-full flex items-center justify-center`}>
                            <span className="text-white font-bold text-sm">{formatted.icon}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{formatted.title}</p>
                            <p className="text-gray-400 text-sm">{formatted.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{formatted.amount}</p>
                          <p className={`text-xs ${
                            formatted.status === 'completed' ? 'text-green-400' : 
                            formatted.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {formatted.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-blue-800/30 text-center">
                <p className="text-gray-400">No transactions yet</p>
                <p className="text-gray-500 text-sm mt-1">Start by making a deposit</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      </div>
    )
  }

  return renderScreen()
}