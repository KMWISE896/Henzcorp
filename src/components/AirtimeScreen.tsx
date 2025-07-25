import React, { useState } from 'react';
import { ArrowLeft, Smartphone, CheckCircle, User, Users } from 'lucide-react';
import { createTransaction, createAirtimePurchase, updateWalletBalance, updateTransactionStatus, formatPhoneNumber, detectNetwork } from '../lib/database';
import { useSupabase } from '../contexts/SupabaseContext';
import TransactionLoader from './TransactionLoader';

interface AirtimeScreenProps {
  onBack: () => void;
  onSuccess?: () => Promise<void>;
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
}

export default function AirtimeScreen({ onBack, onSuccess, showAlert }: AirtimeScreenProps) {
  const { user, profile, getFiatBalance } = useSupabase();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientType, setRecipientType] = useState<'self' | 'other'>('self');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [purchasedAmount, setPurchasedAmount] = useState('');

  // Auto-fill with user's phone if selecting self
  React.useEffect(() => {
    if (recipientType === 'self' && profile?.phone) {
      setPhoneNumber(profile.phone);
    } else if (recipientType === 'other') {
      setPhoneNumber('');
    }
  }, [recipientType, profile]);

  const availableBalance = getFiatBalance();
  const detectedNetwork = phoneNumber ? detectNetwork(phoneNumber) : null;

  const networks = [
    { id: 'mtn', name: 'MTN', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    { id: 'airtel', name: 'Airtel', color: 'text-red-400', bgColor: 'bg-red-500/20' },
    { id: 'utl', name: 'UTL', color: 'text-blue-400', bgColor: 'bg-blue-500/20' }
  ];

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    
    // Auto-fill with user's phone if selecting self
    if (recipientType === 'self' && profile?.phone && !value) {
      setPhoneNumber(profile.phone);
    }
  };

  const handleRecipientTypeChange = (type: 'self' | 'other') => {
    setRecipientType(type);
    
    // Auto-fill phone number if selecting self
    if (type === 'self' && profile?.phone) {
      setPhoneNumber(profile.phone);
    } else if (type === 'other') {
      setPhoneNumber('');
    }
  };

  const handlePurchaseAirtime = async () => {
    if (!user || !phoneNumber || !amount || parseFloat(amount) < 500) {
      showAlert?.showWarning('Invalid Input', 'Please enter a valid phone number and amount (minimum UGX 500)');
      return;
    }

    const purchaseAmount = parseFloat(amount);
    const fee = Math.max(100, purchaseAmount * 0.02); // 2% fee, minimum 100 UGX
    const totalCost = purchaseAmount + fee;

    if (totalCost > availableBalance) {
      showAlert?.showError('Insufficient Balance', 'Please top up your account.');
      return;
    }

    setIsLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const network = detectNetwork(formattedPhone);

      // Create transaction record
      const transaction = await createTransaction({
        user_id: user.id,
        transaction_type: 'airtime_purchase',
        currency: 'UGX',
        amount: purchaseAmount,
        fee: fee,
        description: `Airtime purchase for ${formattedPhone} (${network.toUpperCase()})`
      });

      // Create airtime purchase record
      await createAirtimePurchase({
        transaction_id: transaction.id,
        user_id: user.id,
        phone_number: formattedPhone,
        network: network,
        amount: purchaseAmount,
        recipient_type: recipientType
      });

      // Deduct from wallet
      await updateWalletBalance(user.id, 'UGX', totalCost, 'subtract');

      // Show loading screen
      setIsLoading(false);
      setShowLoader(true);

      // Simulate airtime purchase processing
      setTimeout(async () => {
        try {
          console.log('📱 Processing airtime purchase completion...')
          
          // Verify balance was deducted correctly (it was deducted earlier)
          const currentBalance = await getWalletBalance(user.id, 'UGX')
          console.log(`💰 UGX balance after airtime purchase: ${currentBalance}`)
          
          // Update transaction status
          await updateTransactionStatus(transaction.id, 'completed');
          
          console.log('🔄 Refreshing data after successful airtime purchase...')
          
          // Refresh app data
          if (onSuccess) {
            await onSuccess();
          }
          
          console.log('✅ Data refresh triggered')
          
          // Store the purchased amount before clearing
          setPurchasedAmount(amount);
          setShowLoader(false);
          setShowSuccess(true);
          setAmount('');
          if (recipientType === 'other') {
            setPhoneNumber('');
          }
        } catch (error) {
          console.error('Error completing airtime purchase:', error);
          // Refund if purchase fails
          console.log('🔄 Refunding airtime purchase due to processing failure...')
          await updateWalletBalance(user.id, 'UGX', totalCost, 'add');
          await updateTransactionStatus(transaction.id, 'failed');
          setShowLoader(false);
          showAlert?.showError('Airtime Purchase Failed', 'Purchase failed. Amount has been refunded to your account.');
        }
      }, 100); // Start loading immediately

    } catch (error: any) {
      console.error('Airtime purchase error:', error);
      showAlert?.showError('Purchase Failed', error.message || 'Airtime purchase failed. Please try again.');
      setIsLoading(false);
    }
  };

  if (showLoader) {
    return (
      <TransactionLoader
        type="airtime"
        amount={amount}
        currency="UGX"
        onComplete={() => setShowLoader(false)}
        duration={2500}
      />
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Airtime Sent Successfully!</h2>
          <p className="text-gray-300 mb-8">
            UGX {parseFloat(purchasedAmount || '0').toLocaleString()} airtime has been sent to {phoneNumber}.
          </p>
          <button
            onClick={() => {
              setShowSuccess(false);
              onBack();
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8 py-3 rounded-2xl font-semibold transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

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
        <h1 className="text-xl font-semibold text-white">Buy Airtime</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
          <p className="text-green-300 text-sm mb-2">Available Balance</p>
          <p className="text-white text-2xl font-bold">UGX {availableBalance.toLocaleString()}</p>
        </div>

        {/* Recipient Type */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Who is this for?</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleRecipientTypeChange('self')}
              className={`bg-gradient-to-br backdrop-blur-sm rounded-2xl p-4 border transition-all ${
                recipientType === 'self' 
                  ? 'from-blue-600/30 to-blue-800/30 border-blue-500/50 ring-2 ring-blue-500' 
                  : 'from-gray-600/20 to-gray-800/20 border-gray-500/30 hover:bg-gray-600/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">For Me</p>
                  <p className="text-gray-300 text-sm">Buy for myself</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRecipientTypeChange('other')}
              className={`bg-gradient-to-br backdrop-blur-sm rounded-2xl p-4 border transition-all ${
                recipientType === 'other' 
                  ? 'from-purple-600/30 to-purple-800/30 border-purple-500/50 ring-2 ring-purple-500' 
                  : 'from-gray-600/20 to-gray-800/20 border-gray-500/30 hover:bg-gray-600/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">For Others</p>
                  <p className="text-gray-300 text-sm">Send to someone</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Phone Number Input */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Phone Number</h2>
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/30">
            <div className="relative mb-4">
              <Smartphone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                placeholder="0700123456"
                className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Network Detection */}
            {detectedNetwork && (
              <div className="flex items-center space-x-2 mb-4">
                <div className={`w-8 h-8 ${networks.find(n => n.id === detectedNetwork)?.bgColor} rounded-full flex items-center justify-center`}>
                  <span className={`font-bold text-xs ${networks.find(n => n.id === detectedNetwork)?.color}`}>
                    {detectedNetwork.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">
                  Detected network: <span className={networks.find(n => n.id === detectedNetwork)?.color}>
                    {networks.find(n => n.id === detectedNetwork)?.name}
                  </span>
                </p>
              </div>
            )}

            <p className="text-gray-400 text-xs">
              {recipientType === 'self' ? 'Your phone number' : 'Enter recipient\'s phone number'}
            </p>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Airtime Amount</h2>
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/30">
            <div className="mb-4">
              <label className="block text-blue-300 text-sm mb-2">Amount (UGX)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                min="500"
                max={availableBalance}
              />
              <p className="text-gray-400 text-xs mt-1">Minimum amount: UGX 500</p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {quickAmounts.filter(amt => amt <= availableBalance).map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg py-2 px-3 text-white text-sm transition-colors"
                >
                  {quickAmount.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Fee Information */}
            {amount && parseFloat(amount) >= 500 && (
              <div className="bg-purple-500/10 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Airtime amount:</span>
                  <span className="text-white">UGX {parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Service fee (2%):</span>
                  <span className="text-white">UGX {Math.max(100, parseFloat(amount) * 0.02).toLocaleString()}</span>
                </div>
                <div className="border-t border-purple-500/30 mt-2 pt-2 flex justify-between font-semibold">
                  <span className="text-white">Total cost:</span>
                  <span className="text-purple-400">UGX {(parseFloat(amount) + Math.max(100, parseFloat(amount) * 0.02)).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchaseAirtime}
          disabled={!phoneNumber || !amount || parseFloat(amount) < 500 || isLoading || 
            (parseFloat(amount) + Math.max(100, parseFloat(amount) * 0.02)) > availableBalance}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            phoneNumber && amount && parseFloat(amount) >= 500 && !isLoading &&
            (parseFloat(amount) + Math.max(100, parseFloat(amount) * 0.02)) <= availableBalance
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="relative">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-5 h-5 border-2 border-white border-r-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
              </div>
              <span>Processing...</span>
            </div>
          ) : (
            `Buy UGX ${amount ? parseFloat(amount).toLocaleString() : '0'} Airtime`
          )}
        </button>

        {/* Supported Networks */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
          <h3 className="text-white font-medium mb-3">Supported Networks:</h3>
          <div className="grid grid-cols-3 gap-4">
            {networks.map((network) => (
              <div key={network.id} className="text-center">
                <div className={`w-12 h-12 ${network.bgColor} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <span className={`font-bold ${network.color}`}>{network.name}</span>
                </div>
                <p className="text-gray-300 text-xs">{network.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
          <h3 className="text-white font-medium mb-2">Important Notes:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Airtime is delivered instantly</li>
            <li>• Service fee of 2% applies (minimum UGX 100)</li>
            <li>• Network is automatically detected</li>
            <li>• Minimum purchase amount is UGX 500</li>
          </ul>
        </div>
      </div>
    </div>
  );
}