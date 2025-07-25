import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield,
  TrendingUp,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { adminAuth } from '../../lib/admin-auth';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export default function AdminLayout({ children, currentScreen, onNavigate, onLogout }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const admin = adminAuth.getCurrentAdmin();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'text-purple-400'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: CreditCard,
      color: 'text-green-400'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      color: 'text-yellow-400'
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      color: 'text-red-400'
    },
    {
      id: 'support',
      label: 'Support',
      icon: HelpCircle,
      color: 'text-indigo-400'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'text-gray-400'
    }
  ];

  const handleLogout = () => {
    adminAuth.logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/30 backdrop-blur-sm border-r border-purple-800/30 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-800/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Admin Portal</h2>
                <p className="text-gray-400 text-xs">HenzCorp</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Info */}
          <div className="p-4 border-b border-purple-800/30">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {admin?.first_name?.[0]}{admin?.last_name?.[0]}
                </span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">{admin?.first_name} {admin?.last_name}</p>
                <p className="text-gray-400 text-xs capitalize">{admin?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  currentScreen === item.id
                    ? 'bg-purple-500/20 border border-purple-500/30 text-white'
                    : 'hover:bg-white/5 text-gray-300 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${currentScreen === item.id ? 'text-purple-400' : item.color}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-purple-800/30">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-purple-800/30 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm font-medium">System Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm">3 Pending Reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}