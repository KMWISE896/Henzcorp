import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Gift } from 'lucide-react';
import { signUp } from '../lib/database';

interface SignupScreenProps {
  onSignup: () => void;
  onSwitchToLogin: () => void;
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
  onSignupSubmit?: (email: string, password: string, userData: any) => Promise<void>;
}

export default function SignupScreen({ onSignup, onSwitchToLogin, showAlert, onSignupSubmit }: SignupScreenProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.phone || !formData.password || !formData.confirmPassword) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (!agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);
    
    try {
      if (onSignupSubmit) {
        await onSignupSubmit(formData.email.trim(), formData.password, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          referralCode: formData.referralCode || undefined
        });
      } else {
        await signUp(formData.email.trim(), formData.password, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          referralCode: formData.referralCode || undefined
        });
      }
      
      onSignup();
    } catch (error: any) {
      console.error('Signup error:', error);
      showAlert?.showError('Signup Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-300 mb-2">Feezpay</h1>
          <p className="text-gray-400">Create your crypto wallet account</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-300 text-sm mb-2">First Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="First name"
                  className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-blue-300 text-sm mb-2">Last Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Last name"
                  className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-blue-300 text-sm mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-blue-300 text-sm mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="0700123456"
                className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-blue-300 text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create password"
                  className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl pl-12 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
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
            <div>
              <label className="block text-blue-300 text-sm mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl pl-12 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-blue-300 text-sm mb-2">Referral Code (Optional)</label>
            <div className="relative">
              <Gift className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.referralCode}
                onChange={(e) => handleInputChange('referralCode', e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <p className="text-gray-400 text-xs mt-1">Get UGX 20,000 bonus when you use a referral code!</p>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="w-4 h-4 text-blue-500 bg-transparent border border-gray-400 rounded focus:ring-blue-500 mt-1"
              required
            />
            <p className="text-gray-300 text-sm">
              I agree to the{' '}
              <button type="button" className="text-blue-400 hover:text-blue-300 transition-colors">
                Terms of Service
              </button>
              {' '}and{' '}
              <button type="button" className="text-blue-400 hover:text-blue-300 transition-colors">
                Privacy Policy
              </button>
            </p>
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            disabled={isLoading || !agreeToTerms}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center space-x-2 ${
              !isLoading && agreeToTerms
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30 mt-6">
          <div className="flex items-center space-x-2 mb-2">
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">Secure Registration</span>
          </div>
          <p className="text-gray-300 text-xs">
            Your account is protected with bank-level security and encryption.
          </p>
        </div>
      </div>
    </div>
  );
}