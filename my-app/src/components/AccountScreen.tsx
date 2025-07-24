import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, Shield, Bell, HelpCircle, LogOut, ChevronRight, Edit, Camera, Eye, EyeOff } from 'lucide-react';
import { signOut, updateUserProfile } from '../lib/database';
import { useSupabase } from '../contexts/SupabaseContext';


interface AccountScreenProps {
  onBack: () => void;
  onLogout: () => void;
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
}

export default function AccountScreen({ onBack, onLogout, showAlert }: AccountScreenProps) {
  const { user, profile, refreshProfile, getFiatBalance, getCryptoBalanceUGX, transactions } = useSupabase();
  const [showBalance, setShowBalance] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const userInfo = {
    name: profile ? `${profile.first_name} ${profile.last_name}` : 'Loading...',
    email: user?.email || 'Loading...',
    phone: profile?.phone || 'Loading...',
    joinDate: profile ? `Member since ${new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : 'Loading...',
    verificationStatus: profile?.verification_status === 'verified' ? 'Verified' : 'Pending Verification',
    profileImage: profile?.profile_image_url || null
  };

  const calculateAccountStats = () => {
    const deposits = transactions.filter(t => t.transaction_type === 'deposit');
    const withdrawals = transactions.filter(t => t.transaction_type === 'withdrawal');
    
    const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalDeposits: `UGX ${totalDeposits.toLocaleString()}`,
      totalWithdrawals: `UGX ${totalWithdrawals.toLocaleString()}`,
      totalTransactions: transactions.length,
      referralEarnings: 'UGX 0' // This would come from referral earnings table
    };
  };

  const accountStats = calculateAccountStats();

  const settingsOptions = [
    {
      icon: Shield,
      title: 'Security Settings',
      description: 'Password, 2FA, PIN',
      action: () => showAlert?.showInfo('Coming Soon', 'Security settings feature will be available soon')
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Push notifications, Email alerts',
      action: () => setNotifications(!notifications),
      toggle: true,
      value: notifications
    },
    {
      icon: Eye,
      title: 'Privacy',
      description: 'Balance visibility, Transaction history',
      action: () => setShowBalance(!showBalance),
      toggle: true,
      value: showBalance
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      description: 'FAQ, Contact support',
      action: () => showAlert?.showInfo('Support', 'Contact support at support@henzcorp.com')
    }
  ];

  const handleLogout = async () => {
    try {
      console.log('🚪 Account logout initiated...')
      
      // Clear storage first
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear specific auth keys
      const authKeys = [
        'henzcorp_current_user',
        'henzcorp_session', 
        'supabase.auth.token',
        'sb-xdouqtbiohhfpwjqkqbv-auth-token'
      ]
      
      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        } catch (e) {
          // Ignore errors
        }
      })
      
      await signOut()
      console.log('✅ Supabase logout successful')
      
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if Supabase logout fails, clear storage and proceed
      localStorage.clear()
      sessionStorage.clear()
      onLogout() // Force logout anyway
    }
  };

  const handleEditProfile = () => {
    showAlert?.showInfo('Coming Soon', 'Edit profile feature will be available soon');
  };

  const handleChangeProfilePicture = () => {
    showAlert?.showInfo('Coming Soon', 'Change profile picture feature will be available soon');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white pb-20">
      {/* Header */}
      <div className="flex items-center px-6 pt-12 pb-6">
        <button 
          onClick={onBack}
          className="mr-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-semibold text-white">Account</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Profile Section */}
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                {userInfo.profileImage ? (
                  <img src={userInfo.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {userInfo.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <button
                onClick={handleChangeProfilePicture}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-white text-xl font-semibold">{userInfo.name}</h2>
                <button
                  onClick={handleEditProfile}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Edit className="w-4 h-4 text-blue-300" />
                </button>
              </div>
              <p className="text-blue-300 text-sm mb-1">{userInfo.email}</p>
              <p className="text-gray-400 text-xs">{userInfo.joinDate}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-green-300 text-sm font-medium">{userInfo.verificationStatus}</span>
            </div>
            <span className="text-gray-400 text-sm">{userInfo.phone}</span>
          </div>
        </div>

        {/* Account Statistics */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Account Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
              <p className="text-blue-300 text-sm mb-1">Total Deposits</p>
              <p className="text-white text-lg font-semibold">{accountStats.totalDeposits}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
              <p className="text-blue-300 text-sm mb-1">Total Withdrawals</p>
              <p className="text-white text-lg font-semibold">{accountStats.totalWithdrawals}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
              <p className="text-blue-300 text-sm mb-1">Transactions</p>
              <p className="text-white text-lg font-semibold">{accountStats.totalTransactions}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
              <p className="text-blue-300 text-sm mb-1">Referral Earnings</p>
              <p className="text-white text-lg font-semibold">{accountStats.referralEarnings}</p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Settings</h3>
          <div className="space-y-3">
            {settingsOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                className="w-full bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30 hover:bg-black/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <option.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">{option.title}</p>
                      <p className="text-gray-400 text-sm">{option.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {option.toggle ? (
                      <div className={`w-12 h-6 rounded-full transition-colors ${option.value ? 'bg-blue-500' : 'bg-gray-600'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform transform ${option.value ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30 hover:bg-black/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Transaction History</p>
                    <p className="text-gray-400 text-sm">View all your transactions</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
            
            <button className="w-full bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30 hover:bg-black/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Backup & Recovery</p>
                    <p className="text-gray-400 text-sm">Secure your account</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
            
            <button 
              onClick={() => {
                try {
                  showAlert?.showInfo('Database Mode', 'Using Supabase PostgreSQL database for all data storage.')
                } catch (error) {
                  showAlert?.showError('Error', 'Failed to get database info')
                }
              }}
              className="w-full bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30 hover:bg-black/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Database Info</p>
                    <p className="text-gray-400 text-sm">View database connection</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
            
            <button 
              onClick={() => {
                showAlert?.showInfo('Database Mode', 'All data is stored in Supabase PostgreSQL. No local data to clear.')
              }}
              className="w-full bg-red-600/20 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30 hover:bg-red-600/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Database Status</p>
                    <p className="text-gray-400 text-sm">Connected to Supabase</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600/20 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30 hover:bg-red-600/30 transition-colors"
          >
            <div className="flex items-center justify-center space-x-3">
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">Log Out</span>
            </div>
          </button>
        </div>

        {/* App Version */}
        <div className="text-center pt-4">
          <p className="text-gray-500 text-sm">HenzCorp v1.0.0</p>
        </div>
      </div>
    </div>
  );
}