import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { getAllTransactions } from '../../lib/admin-auth';

interface TransactionManagementProps {
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
}

export default function TransactionManagement({ showAlert }: TransactionManagementProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const transactionData = await getAllTransactions(100, 0);
      setTransactions(transactionData);
    } catch (error) {
      console.error('Error loading transactions:', error);
      showAlert?.showError('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user_profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user_profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      filterType === 'all' || 
      transaction.transaction_type === filterType;
    
    const matchesStatus = 
      filterStatus === 'all' || 
      transaction.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'failed': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'cancelled': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'pending': return Clock;
      case 'failed': return XCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return ArrowDownLeft;
      case 'withdrawal': return ArrowUpRight;
      case 'buy_crypto': return DollarSign;
      case 'sell_crypto': return DollarSign;
      case 'transfer': return ArrowUpRight;
      case 'airtime_purchase': return DollarSign;
      default: return DollarSign;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-green-400';
      case 'withdrawal': return 'text-red-400';
      case 'buy_crypto': return 'text-blue-400';
      case 'sell_crypto': return 'text-orange-400';
      case 'transfer': return 'text-purple-400';
      case 'airtime_purchase': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Transaction Management</h1>
          <p className="text-gray-400">Monitor and manage all platform transactions</p>
        </div>
        <button
          onClick={loadTransactions}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-4 py-2 rounded-xl font-medium transition-all"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-800/30">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by reference ID, user name, or description..."
              className="w-full bg-black/30 backdrop-blur-sm border border-purple-800/30 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-black/30 backdrop-blur-sm border border-purple-800/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="buy_crypto">Buy Crypto</option>
              <option value="sell_crypto">Sell Crypto</option>
              <option value="transfer">Transfers</option>
              <option value="airtime_purchase">Airtime</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-black/30 backdrop-blur-sm border border-purple-800/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-800/30 overflow-hidden">
        <div className="p-4 border-b border-purple-800/30">
          <h2 className="text-white font-semibold">
            Transactions ({filteredTransactions.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-500/10">
              <tr>
                <th className="text-left p-4 text-purple-300 font-medium">Reference</th>
                <th className="text-left p-4 text-purple-300 font-medium">User</th>
                <th className="text-left p-4 text-purple-300 font-medium">Type</th>
                <th className="text-left p-4 text-purple-300 font-medium">Amount</th>
                <th className="text-left p-4 text-purple-300 font-medium">Status</th>
                <th className="text-left p-4 text-purple-300 font-medium">Date</th>
                <th className="text-left p-4 text-purple-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const StatusIcon = getStatusIcon(transaction.status);
                const TypeIcon = getTypeIcon(transaction.transaction_type);
                return (
                  <tr key={transaction.id} className="border-b border-purple-800/20 hover:bg-purple-500/5">
                    <td className="p-4">
                      <p className="text-white font-mono text-sm">{transaction.reference_id}</p>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">
                          {transaction.user_profiles?.first_name} {transaction.user_profiles?.last_name}
                        </p>
                        <p className="text-gray-400 text-sm">{transaction.user_profiles?.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <TypeIcon className={`w-4 h-4 ${getTypeColor(transaction.transaction_type)}`} />
                        <span className="text-white text-sm capitalize">
                          {transaction.transaction_type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">
                          {transaction.currency} {transaction.amount.toLocaleString()}
                        </p>
                        {transaction.fee > 0 && (
                          <p className="text-gray-400 text-xs">Fee: {transaction.fee}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(transaction.status)}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium capitalize">{transaction.status}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white text-sm">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 p-2 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-blue-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No transactions found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 border border-purple-500/30 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Transaction Details</h2>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Reference ID</p>
                  <p className="text-white font-mono">{selectedTransaction.reference_id}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Type</p>
                  <p className="text-white capitalize">{selectedTransaction.transaction_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Amount</p>
                  <p className="text-white font-medium">
                    {selectedTransaction.currency} {selectedTransaction.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Fee</p>
                  <p className="text-white">{selectedTransaction.fee || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className={`font-medium capitalize ${
                    selectedTransaction.status === 'completed' ? 'text-green-400' :
                    selectedTransaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {selectedTransaction.status}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Created</p>
                  <p className="text-white">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedTransaction.description && (
                <div>
                  <p className="text-gray-400 text-sm">Description</p>
                  <p className="text-white">{selectedTransaction.description}</p>
                </div>
              )}

              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Metadata</p>
                  <div className="bg-black/30 rounded-lg p-3">
                    <pre className="text-white text-xs overflow-x-auto">
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}