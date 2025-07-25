import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { signIn } from '../lib/database';

interface LoginScreenProps {
  onLogin: () => void;
  onSwitchToSignup: () => void;
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
  onLoginSubmit?: (email: string, password: string) => Promise<void>;
}

export default function LoginScreen({ onLogin, onSwitchToSignup, showAlert, onLoginSubmit }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showAlert?.showWarning('Missing Information', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    
    try {
      if (onLoginSubmit) {
        await onLoginSubmit(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
      onLogin();
    } catch (error: any) {
      console.error('Login error:', error);
      showAlert?.showError('Login Failed', error.message || 'Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Password reset link will be sent to your email');
  };
  
  {/*
         const handleSocialLogin = (provider: string) => {
    alert(`Login with ${provider} - Feature coming soon!`);
  };
    */}


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-300 mb-2">Feezpay</h1>
          <p className="text-gray-400">Welcome back to your crypto wallet</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-blue-300 text-sm mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <p className="text-gray-400 text-xs mt-1">
              Demo: emma@gmail.com / demo123
            </p>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-blue-300 text-sm mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-500 bg-transparent border border-gray-400 rounded focus:ring-blue-500"
              />
              <span className="text-gray-300 text-sm">Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={!email || !password || isLoading}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center space-x-2 ${
              email && password && !isLoading
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        {/*
        <div className="flex items-center my-8">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-4 text-gray-400 text-sm">Or continue with</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>
        */}

        {/* Social Login */}
        {/*
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => handleSocialLogin('Google')}
            className="bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl py-3 px-4 hover:bg-black/40 transition-colors flex items-center justify-center space-x-2"
          >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <span className="text-black text-xs font-bold">G</span>
            </div>
            <span className="text-white text-sm">Google</span>
          </button>
          <button
            onClick={() => handleSocialLogin('Apple')}
            className="bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl py-3 px-4 hover:bg-black/40 transition-colors flex items-center justify-center space-x-2"
          >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <span className="text-black text-xs font-bold">🍎</span>
            </div>
            <span className="text-white text-sm">Apple</span>
          </button>
        </div>
        */}

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Sign up here
            </button>
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30 mt-8">
          <div className="flex items-center space-x-2 mb-2">
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">Secure Login</span>
          </div>
          <p className="text-gray-300 text-xs">
            Your login is protected with bank-level security and encryption.
          </p>
        </div>
      </div>
    </div>
  );
}