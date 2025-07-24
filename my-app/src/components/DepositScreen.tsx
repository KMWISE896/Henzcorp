import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Building, CheckCircle, Clock } from 'lucide-react';
import { createTransaction, createDeposit, updateWalletBalance, updateTransactionStatus } from '../lib/database';
import { useSupabase } from '../contexts/SupabaseContext';
import TransactionLoader from './TransactionLoader';

interface DepositScreenProps {
  onBack: () => void;
  onSuccess?: () => Promise<void>;
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
}

export default function DepositScreen({ onBack, onSuccess, showAlert }: DepositScreenProps) {
  const { user, getFiatBalance } = useSupabase();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [depositedAmount, setDepositedAmount] = useState('');

  const paymentMethods = [
    {
      id: 'mtn_money' as const,
      name: 'MTN Mobile Money',
      icon: Smartphone,
      color: 'from-yellow-600/20 to-yellow-800/20',
      borderColor: 'border-yellow-500/30',
      description: 'Pay with MTN MoMo'
    },
    {
      id: 'airtel_money' as const,
      name: 'Airtel Money',
      icon: Smartphone,
      color: 'from-red-600/20 to-red-800/20',
      borderColor: 'border-red-500/30',
      description: 'Pay with Airtel Money'
    },
    {
      id: 'bank_transfer' as const,
      name: 'Bank Transfer',
      icon: Building,
      color: 'from-blue-600/20 to-blue-800/20',
      borderColor: 'border-blue-500/30',
      description: 'Direct bank transfer'
    }
  ];

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  const handleDeposit = async () => {
    if (!user || !amount || parseFloat(amount) < 10000) {
      showAlert?.showWarning('Invalid Amount', 'Please enter a valid amount (minimum UGX 10,000)');
      return;
    }

    if ((selectedMethod === 'mtn_money' || selectedMethod === 'airtel_money') && !phoneNumber) {
      showAlert?.showWarning('Phone Number Required', 'Please enter your phone number');
      return;
    }

    setIsLoading(true);

    try {
      const depositAmount = parseFloat(amount);
      const fee = Math.max(1000, depositAmount * 0.01); // 1% fee, minimum 1000 UGX

      // Create transaction record
      const transaction = await createTransaction({
        user_id: user.id,
        transaction_type: 'deposit',
        currency: 'UGX',
        amount: depositAmount,
        fee: fee,
        description: `Deposit via ${selectedMethod ? selectedMethod.replace('_', ' ') : 'unknown method'}`

      });

      // Create deposit record
      await createDeposit({
        transaction_id: transaction.id,
        user_id: user.id,
        payment_method: selectedMethod,
        amount: depositAmount,
        currency: 'UGX',
        external_reference: `DEP_${Date.now()}`
      });

      // Show loading screen
      setIsLoading(false);
      setShowLoader(true);

      // Simulate payment processing (in real app, this would be handled by payment gateway)
      setTimeout(async () => {
        try {
          console.log('🏦 Processing deposit completion...')
          // Update wallet balance
          await updateWalletBalance(user.id, 'UGX', depositAmount, 'add');
          
          // Update transaction status
          await updateTransactionStatus(transaction.id, 'completed');
          
          console.log('🔄 Refreshing data after successful deposit...')
          
          // Refresh app data
          if (onSuccess) {
            await onSuccess();
          }
          
          console.log('✅ Data refresh triggered')
          
          // Store the deposited amount before clearing
          setDepositedAmount(amount);
          setShowLoader(false);
          setShowSuccess(true);
          setAmount('');
          setPhoneNumber('');
        } catch (error) {
          console.error('Error completing deposit:', error);
          await updateTransactionStatus(transaction.id, 'failed');
          setShowLoader(false);
        }
      }, 100); // Start loading immediately

    } catch (error: any) {
      console.error('Deposit error:', error);
      showAlert?.showError('Deposit Failed', error.message || 'Please try again.');
      setIsLoading(false);
    }
  };

  if (showLoader) {
    return (
      <TransactionLoader
        type="deposit"
        paymentMethod={selectedMethod}
        amount={amount}
        currency="UGX"
        onComplete={() => setShowLoader(false)}
        duration={3000}
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
          <h2 className="text-2xl font-bold text-white mb-4">Deposit Successful!</h2>
          <p className="text-gray-300 mb-8">
            Your deposit of UGX {parseFloat(depositedAmount || '0').toLocaleString()} has been processed successfully.
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
        <h1 className="text-xl font-semibold text-white">Deposit Funds</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Payment Methods */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Select Payment Method</h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
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
                min="10000"
                max="100,000,000"
              />
              <p className="text-gray-400 text-xs mt-1">Minimum deposit: UGX 10,000</p>
               <p className="text-gray-400 text-xs mt-1">Minimum deposit: UGX 10,000,000</p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {quickAmounts.map((quickAmount) => (
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
            {amount && parseFloat(amount) >= 10000 && (
              <div className="bg-blue-500/10 rounded-lg p-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Amount:</span>
                  <span className="text-white">UGX {parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Fee (1%):</span>
                  <span className="text-white">UGX {Math.max(1000, parseFloat(amount) * 0.01).toLocaleString()}</span>
                </div>
                <div className="border-t border-blue-500/30 mt-2 pt-2 flex justify-between font-semibold">
                  <span className="text-white">You'll receive:</span>
                  <span className="text-green-400">UGX {parseFloat(amount).toLocaleString()}</span>
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

        {/* Deposit Button */}
        <button
          onClick={handleDeposit}
          disabled={!amount || parseFloat(amount) < 10000 || isLoading || 
            ((selectedMethod === 'mtn_money' || selectedMethod === 'airtel_money') && !phoneNumber)}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            amount && parseFloat(amount) >= 10000 && !isLoading &&
            (!((selectedMethod === 'mtn_money' || selectedMethod === 'airtel_money')) || phoneNumber)
              ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
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
            `Deposit UGX ${amount ? parseFloat(amount).toLocaleString() : '0'}`
          )}
        </button>

        {/* Security Notice */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
          <h3 className="text-white font-medium mb-2">Security Notice:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• All transactions are encrypted and secure</li>
            <li>• Deposits are processed instantly</li>
            <li>• Your payment information is never stored</li>
            <li>• 24/7 customer support available</li>
          </ul>
        </div>
      </div>
    </div>
  );
}