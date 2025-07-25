import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Activity,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { getPlatformStats } from '../../lib/admin-auth';

interface AdminDashboardProps {
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
}

export default function AdminDashboard({ showAlert }: AdminDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlatformStats();
  }, []);

  const loadPlatformStats = async () => {
    try {
      setLoading(true);
      const platformStats = await getPlatformStats();
      setStats(platformStats);
    } catch (error) {
      console.error('Error loading platform stats:', error);
      showAlert?.showError('Error', 'Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-600/20 to-blue-800/20',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Verified Users',
      value: stats?.verified_users || 0,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-600/20 to-green-800/20',
      borderColor: 'border-green-500/30'
    },
    {
      title: 'Total Transactions',
      value: stats?.total_transactions || 0,
      icon: CreditCard,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-600/20 to-purple-800/20',
      borderColor: 'border-purple-500/30'
    },
    {
      title: 'Platform Volume',
      value: `UGX ${(stats?.total_volume_ugx || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'from-yellow-600/20 to-yellow-800/20',
      borderColor: 'border-yellow-500/30'
    },
    {
      title: 'Active Wallets',
      value: stats?.active_wallets || 0,
      icon: Activity,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'from-indigo-600/20 to-indigo-800/20',
      borderColor: 'border-indigo-500/30'
    },
    {
      title: 'Pending Transactions',
      value: stats?.pending_transactions || 0,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-600/20 to-orange-800/20',
      borderColor: 'border-orange-500/30'
    }
  ];

  const transactionStats = [
    {
      title: 'Completed',
      value: stats?.completed_transactions || 0,
      icon: CheckCircle,
      color: 'text-green-400'
    },
    {
      title: 'Pending',
      value: stats?.pending_transactions || 0,
      icon: Clock,
      color: 'text-yellow-400'
    },
    {
      title: 'Failed',
      value: stats?.failed_transactions || 0,
      icon: XCircle,
      color: 'text-red-400'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Platform overview and key metrics</p>
        </div>
        <button
          onClick={loadPlatformStats}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-4 py-2 rounded-xl font-medium transition-all"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${stat.bgColor} backdrop-blur-sm rounded-2xl p-6 border ${stat.borderColor}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-300 text-sm mb-1">{stat.title}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Breakdown */}
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-800/30">
        <h2 className="text-white font-semibold text-lg mb-4">Transaction Status Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          {transactionStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className="text-white text-xl font-bold">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-800/30">
        <h2 className="text-white font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl p-4 transition-colors">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-white text-sm font-medium">Manage Users</p>
          </button>
          <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl p-4 transition-colors">
            <CreditCard className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-white text-sm font-medium">View Transactions</p>
          </button>
          <button className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-xl p-4 transition-colors">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-white text-sm font-medium">Pending Reviews</p>
          </button>
          <button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl p-4 transition-colors">
            <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-white text-sm font-medium">System Health</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-800/30">
        <h2 className="text-white font-semibold text-lg mb-4">Recent Platform Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-white text-sm font-medium">New user registration</p>
              <p className="text-gray-400 text-xs">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white text-sm font-medium">Large deposit processed</p>
              <p className="text-gray-400 text-xs">5 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <Clock className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-white text-sm font-medium">Withdrawal pending review</p>
              <p className="text-gray-400 text-xs">10 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}