import React, { useState } from 'react';
import { ArrowLeft, Smartphone, Building, CheckCircle, AlertCircle } from 'lucide-react';
import { createTransaction, createWithdrawal, updateWalletBalance, updateTransactionStatus, savePhoneNumber, getSavedPhoneNumber } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../contexts/AppContext';
import TransactionLoader from './TransactionLoader';

interface WithdrawScreenProps {
  onBack: () => void;
  onSuccess?: () => Promise<void>;
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
}

export default function WithdrawScreen({ onBack, onSuccess, showAlert }: WithdrawScreenProps) {
  const { user } = useAuth();
  const { getFiatBalance } = useAppData();
  const [selectedMethod, setSelectedMethod] = useState<'mtn_money' | 'airtel_money' | 'bank_transfer'>('mtn_money');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    bankName: '',
    accountName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [withdrawnAmount, setWithdrawnAmount] = useState('');

  // Load saved phone number when component mounts or method changes
  React.useEffect(() => {
    if (user && (selectedMethod === 'mtn_money' || selectedMethod === 'airtel_money')) {
      const savedPhone = getSavedPhoneNumber(user.id, 'withdrawal');
      if (savedPhone && !phoneNumber) {
        setPhoneNumber(savedPhone);
      }
    }
  }, [user, selectedMethod]);

  const availableBalance = getFiatBalance();

  const withdrawalMethods = [
    {
      id: 'mtn_money' as const,
      name: 'MTN Mobile Money',
      icon: Smartphone,
      color: 'from-yellow-600/20 to-yellow-800/20',
      borderColor: 'border-yellow-500/30',
      description: 'Withdraw to MTN MoMo'
    },
    {
      id: 'airtel_money' as const,
      name: 'Airtel Money',
      icon: Smartphone,
      color: 'from-red-600/20 to-red-800/20',
      borderColor: 'border-red-500/30',
      description: 'Withdraw to Airtel Money'
    },
    {
      id: 'bank_transfer' as const,
      name: 'Bank Transfer',
      icon: Building,
      color: 'from-blue-600/20 to-blue-800/20',
      borderColor: 'border-blue-500/30',
      description: 'Withdraw to bank account'
    }
  ];

  const quickAmounts = [50000, 100000, 200000, 500000];

  const calculateFee = (amount: number) => {
    return Math.max(2000, amount * 0.015); // 1.5% fee, minimum 2000 UGX
  };

  const handleWithdraw = async () => {
    if (!user || !amount || parseFloat(amount) < 20000) {
      showAlert?.showWarning('Invalid Amount', 'Please enter a valid amount (minimum UGX 20,000)');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    const fee = calculateFee(withdrawAmount);
    const totalDeduction = withdrawAmount + fee;

    if (totalDeduction > availableBalance) {
      showAlert?.showError('Insufficient Balance', 'Please check your available balance.');
      return;
    }

    if ((selectedMethod === 'mtn_money' || selectedMethod === 'airtel_money') && !phoneNumber) {
      showAlert?.showWarning('Phone Number Required', 'Please enter your phone number');
      return;
    }

    if (selectedMethod === 'bank_transfer' && (!bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.accountName)) {
      showAlert?.showWarning('Bank Details Required', 'Please fill in all bank details');
      return;
    }

    setIsLoading(true);

    try {
      // Save phone number for future use
      if ((selectedMethod === 'mtn_money' || selectedMethod === 'airtel_money') && phoneNumber) {
        savePhoneNumber(user.id, phoneNumber, 'withdrawal');
      }

      // Create transaction record
      const transaction = await createTransaction({
        user_id: user.id,
        transaction_type: 'withdrawal',
        currency: 'UGX',
        amount: withdrawAmount,
        fee: fee,
        description: `Withdrawal via ${selectedMethod.replace('_', ' ')}`
      });

      // Prepare destination details
      const destinationDetails = selectedMethod === 'bank_transfer' 
        ? bankDetails 
        : { phoneNumber };

      // Create withdrawal record
      await createWithdrawal({
        transaction_id: transaction.id,
        user_id: user.id,
        withdrawal_method: selectedMethod,
        amount: withdrawAmount,
        currency: 'UGX',
        destination_details: destinationDetails
      });

      // Deduct from wallet immediately
      await updateWalletBalance(user.id, 'UGX', totalDeduction, 'subtract');

      // Show loading screen
      setIsLoading(false);
      setShowLoader(true);

      // Simulate withdrawal processing
      setTimeout(async () => {
        try {
          console.log('🏦 Processing withdrawal completion...')
          // Update transaction status
          await updateTransactionStatus(transaction.id, 'completed');
          
          console.log('🔄 Refreshing data after successful withdrawal...')
          
          // Refresh app data
          if (onSuccess) {
            await onSuccess();
          }
          
          console.log('✅ Data refresh triggered')
          
          // Store the withdrawn amount before clearing
          setWithdrawnAmount(amount);
          setShowLoader(false);
          setShowSuccess(true);
          setAmount('');
          setPhoneNumber('');
          setBankDetails({ accountNumber: '', bankName: '', accountName: '' });
        } catch (error) {
          console.error('Error completing withdrawal:', error);
          // Refund the amount if withdrawal fails
          await updateWalletBalance(user.id, 'UGX', totalDeduction, 'add');
          await updateTransactionStatus(transaction.id, 'failed');
          setShowLoader(false);
        }
      }, 100); // Start loading immediately

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      showAlert?.showError('Withdrawal Failed', error.message || 'Please try again.');
      setIsLoading(false);
    }
  };

  if (showLoader) {
    return (
      <TransactionLoader
        type="withdrawal"
        paymentMethod={selectedMethod}
        amount={amount}
        currency="UGX"
        onComplete={() => setShowLoader(false)}
        duration={3500}
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
          <h2 className="text-2xl font-bold text-white mb-4">Withdrawal Successful!</h2>
          <p className="text-gray-300 mb-8">
            Your withdrawal of UGX {parseFloat(withdrawnAmount || '0').toLocaleString()} has been processed successfully.
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
        <h1 className="text-xl font-semibold text-white">Withdraw Funds</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
          <p className="text-green-300 text-sm mb-2">Available Balance</p>
          <p className="text-white text-2xl font-bold">UGX {availableBalance.toLocaleString()}</p>
        </div>

        {/* Withdrawal Methods */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Select Withdrawal Method</h2>
          <div className="space-y-3">
            {withdrawalMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full bg-gradient-to-br ${method.color} backdrop-blur-sm rounded-2xl p-4 border ${method.borderColor} transition-all ${
                  selectedMethod === method.id ? 'ring-2 ring-blue-500' : 'hover:bg-opacity-80'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <method.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{method.name}</p>
                    <p className="text-gray-300 text-sm">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <div className="ml-auto">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Enter Amount</h2>
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/30">
            <div className="mb-4">
              <label className="block text-blue-300 text-sm mb-2">Amount (UGX)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                min="20000"
                max={availableBalance}
              />
              <p className="text-gray-400 text-xs mt-1">Minimum withdrawal: UGX 20,000</p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {quickAmounts.filter(amt => amt <= availableBalance).map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg py-2 px-3 text-white text-sm transition-colors"
                >
                  {quickAmount.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Fee Information */}
            {amount && parseFloat(amount) >= 20000 && (
              <div className="bg-red-500/10 rounded-lg p-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Withdrawal amount:</span>
                  <span className="text-white">UGX {parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Fee (1.5%):</span>
                  <span className="text-white">UGX {calculateFee(parseFloat(amount)).toLocaleString()}</span>
                </div>
                <div className="border-t border-red-500/30 mt-2 pt-2 flex justify-between font-semibold">
                  <span className="text-white">Total deduction:</span>
                  <span className="text-red-400">UGX {(parseFloat(amount) + calculateFee(parseFloat(amount))).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phone Number Input (for mobile money) */}
        {(selectedMethod === 'mtn_money' || selectedMethod === 'airtel_money') && (
          <div>
            <h2 className="text-white font-semibold text-lg mb-4">Phone Number</h2>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/30">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0700123456"
                className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-gray-400 text-xs mt-2">
                Enter the phone number registered with your {selectedMethod === 'mtn_money' ? 'MTN MoMo' : 'Airtel Money'} account
              </p>
            </div>
          </div>
        )}

        {/* Bank Details (for bank transfer) */}
        {selectedMethod === 'bank_transfer' && (
          <div>
            <h2 className="text-white font-semibold text-lg mb-4">Bank Details</h2>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/30 space-y-4">
              <div>
                <label className="block text-blue-300 text-sm mb-2">Bank Name</label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="e.g., Stanbic Bank"
                  className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-blue-300 text-sm mb-2">Account Number</label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Enter account number"
                  className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-blue-300 text-sm mb-2">Account Name</label>
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="Account holder name"
                  className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {amount && parseFloat(amount) > 0 && (parseFloat(amount) + calculateFee(parseFloat(amount))) > availableBalance && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium">Insufficient Balance</p>
            </div>
            <p className="text-gray-300 text-sm mt-1">
              You need UGX {((parseFloat(amount) + calculateFee(parseFloat(amount))) - availableBalance).toLocaleString()} more to complete this withdrawal.
            </p>
          </div>
        )}

        {/* Withdraw Button */}
        <button
          onClick={handleWithdraw}
          disabled={!amount || parseFloat(amount) < 20000 || isLoading || 
            (parseFloat(amount) + calculateFee(parseFloat(amount))) > availableBalance ||
            ((selectedMethod === 'mtn_money' || selectedMethod === 'airtel_money') && !phoneNumber) ||
            (selectedMethod === 'bank_transfer' && (!bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.accountName))}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            amount && parseFloat(amount) >= 20000 && !isLoading &&
            (parseFloat(amount) + calculateFee(parseFloat(amount))) <= availableBalance &&
            (selectedMethod !== 'bank_transfer' || (bankDetails.accountNumber && bankDetails.bankName && bankDetails.accountName)) &&
            ((selectedMethod !== 'mtn_money' && selectedMethod !== 'airtel_money') || phoneNumber)
              ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white'
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
            `Withdraw UGX ${amount ? parseFloat(amount).toLocaleString() : '0'}`
          )}
        </button>

        {/* Security Notice */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
          <h3 className="text-white font-medium mb-2">Important Notes:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Withdrawals are processed within 24 hours</li>
            <li>• Minimum withdrawal amount is UGX 20,000</li>
            <li>• Withdrawal fees apply as shown above</li>
            <li>• Ensure your account details are correct</li>
          </ul>
        </div>
      </div>
    </div>
  );
}