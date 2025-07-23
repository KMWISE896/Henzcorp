import React, { useState } from 'react'
import { Home, ArrowUpDown, Plus, Minus, Smartphone, Users, User } from 'lucide-react'
import { useSupabase } from './contexts/SupabaseContext'
import { useAlert } from './hooks/useAlert'
import { signIn, signUp, signOut } from './lib/database'

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

type Screen = 'home' | 'deposit' | 'withdraw' | 'airtime' | 'buy-crypto' | 'transfer' | 'referral' | 'account'

export default function AppDatabase() {
  const { 
    user, 
    profile, 
    loading: authLoading,
    wallets,
    transactions,
    dataLoading,
    refreshData,
    getFiatBalance,
    getCryptoBalanceUGX
  } = useSupabase()
  
  const { alerts, hideAlert, showSuccess, showError, showWarning, showInfo } = useAlert()
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [showLogin, setShowLogin] = useState(true)

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-purple-500 border-r-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth screens if not authenticated
  if (!user) {
    return showLogin ? (
      <>
        <LoginScreen 
          onLogin={() => {
            showSuccess('Welcome back!', 'You have successfully logged in.')
          }}
          onSwitchToSignup={() => setShowLogin(false)}
          showAlert={{ showSuccess, showError, showWarning, showInfo }}
        />
        <AlertContainer alerts={alerts} onClose={hideAlert} />
      </>
    ) : (
      <>
        <SignupScreen 
          onSignup={() => {
            showSuccess('Account Created!', 'Welcome to HenzCorp! Your account has been created successfully.')
          }}
          onSwitchToLogin={() => setShowLogin(true)}
          showAlert={{ showSuccess, showError, showWarning, showInfo }}
        />
        <AlertContainer alerts={alerts} onClose={hideAlert} />
      </>
    )
  }

  // Render different screens
  const renderScreen = () => {
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
              onLogout={async () => {
                await signOut()
                showInfo('Logged Out', 'You have been successfully logged out.')
                setShowLogin(true)
                setCurrentScreen('home')
              }}
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
                Welcome back, {profile?.first_name || 'User'}!
              </h2>
              <p className="text-blue-300 text-sm">
                {profile?.verification_status === 'verified' ? '✓ Verified Account' : 'Pending Verification'}
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
              <p className="text-white text-3xl font-bold mb-4">
                {dataLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <span key={`${fiatBalance}-${cryptoBalance}`}>
                    UGX {totalBalance.toLocaleString()}
                  </span>
                )}
              </p>
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
            {dataLoading ? (
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-blue-800/30 text-center">
                <div className="relative mx-auto mb-2">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-6 h-6 border-2 border-purple-500 border-r-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
                </div>
                <p className="text-gray-400 text-sm">Loading transactions...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => {
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