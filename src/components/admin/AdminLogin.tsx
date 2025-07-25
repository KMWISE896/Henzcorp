import React, { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { adminAuth } from '../../lib/admin-auth';

interface AdminLoginProps {
  onLogin: () => void;
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
}

export default function AdminLogin({ onLogin, showAlert }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showAlert?.showWarning('Missing Information', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // For demo purposes, accept the demo credentials
      if (email.trim() === 'admin@henzcorp.com' && password === 'admin123') {
        // Create a demo session
        const demoSession = {
          token: 'demo-admin-token',
          admin: {
            id: 'demo-admin-id',
            email: 'admin@henzcorp.com',
            first_name: 'System',
            last_name: 'Administrator',
            role: 'super_admin'
          },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        localStorage.setItem('admin_session', JSON.stringify(demoSession));
        showAlert?.showSuccess('Welcome!', 'Successfully logged in to admin portal.');
        onLogin();
      } else {
        throw new Error('Invalid credentials. Use admin@henzcorp.com / admin123');
      }
      showAlert?.showSuccess('Welcome!', 'Successfully logged in to admin portal.');
      onLogin();
    } catch (error: any) {
      console.error('Admin login error:', error);
      showAlert?.showError('Login Failed', error.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-purple-300 mb-2">Admin Portal</h1>
          <p className="text-gray-400">HenzCorp Management System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-purple-300 text-sm mb-2">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="w-full bg-black/30 backdrop-blur-sm border border-purple-800/30 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
            <p className="text-gray-400 text-xs mt-1">
              Demo: admin@henzcorp.com / admin123
            </p>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-purple-300 text-sm mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-black/30 backdrop-blur-sm border border-purple-800/30 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={!email || !password || isLoading}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center space-x-2 ${
              email && password && !isLoading
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Access Admin Portal</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-800/30 mt-8">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">Restricted Access</span>
          </div>
          <p className="text-gray-300 text-xs">
            This portal is for authorized administrators only. All activities are logged and monitored.
          </p>
        </div>

        {/* Back to App */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Not an admin?{' '}
            <button
              onClick={() => window.location.href = '/'}
              className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Go to main app
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}