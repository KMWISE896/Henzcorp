import React, { useState } from 'react';
import { Copy, Share2, Users, Gift, DollarSign, Trophy, Check, ArrowLeft } from 'lucide-react';
import { getReferralStats, getUserReferrals } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface ReferralScreenProps {
  onBack: () => void;
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
}

export default function ReferralScreen({ onBack, showAlert }: ReferralScreenProps) {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    thisMonth: 0
  });
  const [recentReferrals, setRecentReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const referralCode = profile?.referral_code || 'HENZ2024XYZ';
  const referralLink = `https://henzcorp.com/ref/${referralCode}`;

  React.useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [stats, referrals] = await Promise.all([
        getReferralStats(user.id),
        getUserReferrals(user.id)
      ]);
      
      if (stats && stats.length > 0) {
        setReferralStats({
          totalReferrals: Number(stats[0].total_referrals) || 0,
          totalEarnings: Number(stats[0].total_earnings) || 0,
          pendingEarnings: Number(stats[0].pending_earnings) || 0,
          thisMonth: Number(stats[0].this_month_referrals) || 0
        });
      }
      
      setRecentReferrals(referrals || []);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    showAlert?.showSuccess('Copied!', 'Referral code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showAlert?.showSuccess('Copied!', 'Referral link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join HenzCorp',
        text: `Join me on HenzCorp and start earning! Use my referral code: ${referralCode}`,
        url: referralLink
      });
    } else {
      showAlert?.showInfo('Share Link', 'Referral link copied to clipboard for sharing');
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white pb-20">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={onBack}
            className="mr-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-center text-blue-300 mb-8">REFER & EARN</h1>
        
        {/* Earnings Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-2xl p-4 border border-green-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <p className="text-green-300 text-sm">Total Earnings</p>
            </div>
            <p className="text-white text-lg font-semibold">
              {loading ? 'Loading...' : `UGX ${referralStats.totalEarnings.toLocaleString()}`}
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <p className="text-blue-300 text-sm">Total Referrals</p>
            </div>
            <p className="text-white text-lg font-semibold">
              {loading ? 'Loading...' : referralStats.totalReferrals}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
            <div className="flex items-center space-x-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <p className="text-blue-300 text-sm">This Month</p>
            </div>
            <p className="text-white text-lg font-semibold">
              {loading ? 'Loading...' : referralStats.thisMonth}
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
            <div className="flex items-center space-x-2 mb-2">
              <Gift className="w-5 h-5 text-purple-400" />
              <p className="text-blue-300 text-sm">Pending</p>
            </div>
            <p className="text-white text-lg font-semibold">
              {loading ? 'Loading...' : `UGX ${referralStats.pendingEarnings.toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 mb-6">
          <h2 className="text-white font-semibold text-lg mb-4 text-center">Your Referral Code</h2>
          
          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-mono text-lg tracking-wider">{referralCode}</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <p className="text-gray-300 text-sm mb-2">Referral Link:</p>
            <div className="flex items-center justify-between">
              <span className="text-white text-sm truncate mr-2">{referralLink}</span>
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
                <span className="text-xs">Copy</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2"
          >
            <Share2 className="w-5 h-5" />
            <span>Share with Friends</span>
          </button>
        </div>

        {/* How it Works */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/30 mb-6">
          <h3 className="text-white font-semibold text-lg mb-4">How it Works</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <p className="text-white font-medium">Share your code</p>
                <p className="text-gray-400 text-sm">Send your referral code to friends and family</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <p className="text-white font-medium">They sign up</p>
                <p className="text-gray-400 text-sm">Your friend creates an account using your code</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <p className="text-white font-medium">You both earn</p>
                <p className="text-gray-400 text-sm">Get UGX 20,000 when they make their first deposit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Referrals */}
        <div className="mb-6">
          <h3 className="text-white font-semibold text-lg mb-4">Recent Referrals</h3>
          {loading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading referrals...</p>
            </div>
          ) : recentReferrals.length > 0 ? (
            <div className="space-y-3">
              {recentReferrals.map((referral, index) => (
                <div key={index} className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {referral.referred?.first_name?.[0]}{referral.referred?.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {referral.referred?.first_name} {referral.referred?.last_name}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${referral.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                        UGX {referral.reward_amount?.toLocaleString() || '20,000'}
                      </p>
                      <p className={`text-xs ${referral.status === 'completed' ? 'text-green-300' : 'text-yellow-300'}`}>
                        {referral.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No referrals yet</p>
              <p className="text-gray-500 text-sm mt-1">Share your code to start earning!</p>
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
          <h3 className="text-white font-medium mb-2">Terms & Conditions:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Earn UGX 20,000 for each successful referral</li>
            <li>• Referred user must deposit minimum UGX 50,000</li>
            <li>• Earnings are credited within 24 hours</li>
            <li>• No limit on number of referrals</li>
            <li>• Bonus earnings may apply during promotions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}