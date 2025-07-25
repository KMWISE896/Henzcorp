import React, { useState, useEffect } from 'react';
import { adminAuth } from './lib/admin-auth';
import { useAlert } from './hooks/useAlert';

// Import admin components
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import TransactionManagement from './components/admin/TransactionManagement';
import AlertContainer from './components/AlertContainer';

type AdminScreen = 'dashboard' | 'users' | 'transactions' | 'analytics' | 'security' | 'support' | 'settings';

export default function AdminApp() {
  const { alerts, hideAlert, showSuccess, showError, showWarning, showInfo } = useAlert();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<AdminScreen>('dashboard');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const admin = await adminAuth.validateSession();
      setIsAuthenticated(!!admin);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentScreen('dashboard');
  };

  const renderScreen = () => {
    const alertProps = { showSuccess, showError, showWarning, showInfo };

    switch (currentScreen) {
      case 'users':
        return <UserManagement showAlert={alertProps} />;
      case 'transactions':
        return <TransactionManagement showAlert={alertProps} />;
      case 'analytics':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Analytics</h1>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-800/30 text-center">
              <p className="text-gray-400">Analytics dashboard coming soon...</p>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Security</h1>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-800/30 text-center">
              <p className="text-gray-400">Security management coming soon...</p>
            </div>
          </div>
        );
      case 'support':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Support</h1>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-800/30 text-center">
              <p className="text-gray-400">Support management coming soon...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Settings</h1>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-800/30 text-center">
              <p className="text-gray-400">System settings coming soon...</p>
            </div>
          </div>
        );
      default:
        return <AdminDashboard showAlert={alertProps} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AdminLogin 
          onLogin={handleLogin}
          showAlert={{ showSuccess, showError, showWarning, showInfo }}
        />
        <AlertContainer alerts={alerts} onClose={hideAlert} />
      </>
    );
  }

  return (
    <>
      <AdminLayout
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        onLogout={handleLogout}
      >
        {renderScreen()}
      </AdminLayout>
      <AlertContainer alerts={alerts} onClose={hideAlert} />
    </>
  );
}