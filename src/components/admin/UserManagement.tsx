import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Edit,
  Ban
} from 'lucide-react';
import { getAllUsers, updateUserVerification } from '../../lib/admin-auth';

interface UserManagementProps {
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
}

export default function UserManagement({ showAlert }: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await getAllUsers(100, 0);
      setUsers(userData);
    } catch (error) {
      console.error('Error loading users:', error);
      showAlert?.showError('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationUpdate = async (userId: string, status: 'verified' | 'rejected') => {
    try {
      await updateUserVerification(userId, status);
      await loadUsers(); // Refresh the list
      showAlert?.showSuccess('Updated', `User verification status updated to ${status}`);
    } catch (error) {
      console.error('Error updating verification:', error);
      showAlert?.showError('Error', 'Failed to update user verification');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.referral_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      user.verification_status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'rejected': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return CheckCircle;
      case 'pending': return Clock;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">Manage user accounts and verification status</p>
        </div>
        <button
          onClick={loadUsers}
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
              placeholder="Search users by name, phone, or referral code..."
              className="w-full bg-black/30 backdrop-blur-sm border border-purple-800/30 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-black/30 backdrop-blur-sm border border-purple-800/30 rounded-xl pl-12 pr-8 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-800/30 overflow-hidden">
        <div className="p-4 border-b border-purple-800/30">
          <h2 className="text-white font-semibold">
            Users ({filteredUsers.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-500/10">
              <tr>
                <th className="text-left p-4 text-purple-300 font-medium">User</th>
                <th className="text-left p-4 text-purple-300 font-medium">Contact</th>
                <th className="text-left p-4 text-purple-300 font-medium">Status</th>
                <th className="text-left p-4 text-purple-300 font-medium">Joined</th>
                <th className="text-left p-4 text-purple-300 font-medium">Referral</th>
                <th className="text-left p-4 text-purple-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const StatusIcon = getStatusIcon(user.verification_status);
                return (
                  <tr key={user.id} className="border-b border-purple-800/20 hover:bg-purple-500/5">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-gray-400 text-sm">ID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white text-sm">{user.phone}</p>
                        <p className="text-gray-400 text-xs">Phone</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(user.verification_status)}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium capitalize">{user.verification_status}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-purple-400 text-sm font-mono">{user.referral_code}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {user.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerificationUpdate(user.id, 'verified')}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 p-2 rounded-lg transition-colors"
                              title="Verify User"
                            >
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </button>
                            <button
                              onClick={() => handleVerificationUpdate(user.id, 'rejected')}
                              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 p-2 rounded-lg transition-colors"
                              title="Reject User"
                            >
                              <XCircle className="w-4 h-4 text-red-400" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 p-2 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-6 border border-purple-500/30 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Name</p>
                  <p className="text-white font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <p className="text-white font-medium">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className={`font-medium capitalize ${
                    selectedUser.verification_status === 'verified' ? 'text-green-400' :
                    selectedUser.verification_status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {selectedUser.verification_status}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Referral Code</p>
                  <p className="text-purple-400 font-mono">{selectedUser.referral_code}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Joined</p>
                  <p className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Last Updated</p>
                  <p className="text-white">{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedUser.verification_status === 'pending' && (
                <div className="flex space-x-4 pt-4 border-t border-purple-800/30">
                  <button
                    onClick={() => {
                      handleVerificationUpdate(selectedUser.id, 'verified');
                      setSelectedUser(null);
                    }}
                    className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 py-3 rounded-xl font-medium text-green-400 transition-colors"
                  >
                    Verify User
                  </button>
                  <button
                    onClick={() => {
                      handleVerificationUpdate(selectedUser.id, 'rejected');
                      setSelectedUser(null);
                    }}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 py-3 rounded-xl font-medium text-red-400 transition-colors"
                  >
                    Reject User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}