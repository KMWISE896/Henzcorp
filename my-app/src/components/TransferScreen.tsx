import React, { useState } from 'react';
import { ArrowLeft, Send, User, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { createTransaction, createCryptoTransfer, updateWalletBalance, updateTransactionStatus, getUserProfile } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../contexts/AppContext';

interface TransferScreenProps {
  onBack: () => void;
  onSuccess?: () => Promise<void>;
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
}

export default function TransferScreen({ onBack, onSuccess, showAlert }: TransferScreenProps) {
  const { user } = useAuth();
  const { wallets, getWalletBalance } = useAppData();
  const [transferType, setTransferType] = useState<'internal' | 'external'>('internal');
  const [selectedCurrency, setSelectedCurrency] = useState('UGX');
  const [amount, setAmount] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<any>(null);
  const [completedTransfer, setCompletedTransfer] = useState<{
    amount: string;
    currency: string;
  } | null>(null);

  const availableBalance = getWalletBalance(selectedCurrency);
  const availableCurrencies = wallets.filter(w => w.available_balance > 0);

  const calculateFee = (amount: number, currency: string) => {
    if (currency === 'UGX') {
      return Math.max(1000, amount * 0.01); // 1% fee, minimum 1000 UGX
    } else {
      // Crypto transfer fees (simplified)
      const cryptoFees: { [key: string]: number } = {
        'BTC': 0.0001,
        'ETH': 0.001,
        'LTC': 0.001,
        'USDT': 1
      };
      return cryptoFees[currency] || 0.001;
    }
  };

  const handleRecipientSearch = async (searchTerm: string) => {
    if (!searchTerm || transferType !== 'internal') return;

    try {
      // Search by referral code or user ID
      const profile = await getUserProfile(searchTerm);
      if (profile) {
        setRecipientInfo({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`,
          referralCode: profile.referral_code
        });
      } else {
        setRecipientInfo(null);
      }
    } catch (error) {
      setRecipientInfo(null);
    }
  };

  const handleTransfer = async () => {
    if (!user || !amount || parseFloat(amount) <= 0) {
      showAlert?.showWarning('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const transferAmount = parseFloat(amount);
    const fee = calculateFee(transferAmount, selectedCurrency);
    const totalCost = selectedCurrency === 'UGX' ? transferAmount + fee : transferAmount;

    if (totalCost > availableBalance) {
      showAlert?.showError('Insufficient Balance', 'Insufficient balance for this transfer');
      return;
    }

    if (transferType === 'internal' && !recipientId) {
      showAlert?.showWarning('Recipient Required', 'Please select a valid recipient');
      return;
    }

    if (transferType === 'external' && !recipientAddress) {
      showAlert?.showWarning('Address Required', 'Please enter a valid recipient address');
      return;
    }

    setIsLoading(true);

    try {
      // Create transaction record
      const transaction = await createTransaction({
        user_id: user.id,
        transaction_type: 'transfer',
        currency: selectedCurrency,
        amount: transferAmount,
        fee: selectedCurrency === 'UGX' ? fee : 0,
        description: `Transfer ${transferAmount} ${selectedCurrency} ${transferType === 'internal' ? 'to user' : 'to external address'}`
      });

      // Create crypto transfer record
      await createCryptoTransfer({
        transaction_id: transaction.id,
        sender_id: user.id,
        recipient_id: transferType === 'internal' ? recipientId : undefined,
        recipient_address: transferType === 'external' ? recipientAddress : undefined,
        crypto_symbol: selectedCurrency,
        amount: transferAmount,
        network_fee: selectedCurrency !== 'UGX' ? fee : 0,
        transfer_type: transferType,
        memo: memo || undefined
      });

      // Deduct from sender's wallet
      await updateWalletBalance(user.id, selectedCurrency, totalCost, 'subtract');

      // For internal transfers, add to recipient's wallet
      if (transferType === 'internal' && recipientId) {
        await updateWalletBalance(recipientId, selectedCurrency, transferAmount, 'add');
      }

      // Simulate transfer processing
      setTimeout(async () => {
        try {
          console.log('💸 Processing transfer completion...')
          await updateTransactionStatus(transaction.id, 'completed');
          
          console.log('🔄 Refreshing data after successful transfer...')
          
         // Refresh app data
         if (onSuccess) {
           await onSuccess();
         }
          
          console.log('✅ Data refresh triggered')
          
          // Store the transfer details before clearing
          setCompletedTransfer({
            amount,
            currency: selectedCurrency
          });
          setShowSuccess(true);
          setAmount('');
          setRecipientId('');
          setRecipientAddress('');
          setMemo('');
          setRecipientInfo(null);
        } catch (error) {
          console.error('Error completing transfer:', error);
          await updateTransactionStatus(transaction.id, 'failed');
        }
      }, 2000);

    } catch (error: any) {
      console.error('Transfer error:', error);
      showAlert?.showError('Transfer Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Transfer Successful!</h2>
          <p className="text-gray-300 mb-8">
            Your transfer of {completedTransfer?.amount} {completedTransfer?.currency} has been processed successfully.
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
        <h1 className="text-xl font-semibold text-white">Transfer Funds</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Transfer Type Selection */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Transfer Type</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTransferType('internal')}
              className={`bg-gradient-to-br backdrop-blur-sm rounded-2xl p-4 border transition-all ${
                transferType === 'internal' 
                  ? 'from-blue-600/30 to-blue-800/30 border-blue-500/50 ring-2 ring-blue-500' 
                  : 'from-gray-600/20 to-gray-800/20 border-gray-500/30 hover:bg-gray-600/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Internal</p>
                  <p className="text-gray-300 text-sm">To HenzCorp user</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setTransferType('external')}
              className={`bg-gradient-to-br backdrop-blur-sm rounded-2xl p-4 border transition-all ${
                transferType === 'external' 
                  ? 'from-purple-600/30 to-purple-800/30 border-purple-500/50 ring-2 ring-purple-500' 
                  : 'from-gray-600/20 to-gray-800/20 border-gray-500/30 hover:bg-gray-600/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Send className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">External</p>
                  <p className="text-gray-300 text-sm">To external wallet</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Currency Selection */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Select Currency</h2>
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/30">
            <div className="grid grid-cols-2 gap-3">
              {availableCurrencies.map((wallet) => (
                <button
                  key={wallet.currency}
                  onClick={() => setSelectedCurrency(wallet.currency)}
                  className={`p-3 rounded-xl border transition-all ${
                    selectedCurrency === wallet.currency
                      ? 'bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500'
                      : 'bg-gray-600/20 border-gray-500/30 hover:bg-gray-600/30'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-white font-medium">{wallet.currency}</p>
                    <p className="text-gray-300 text-sm">
                      {wallet.currency === 'UGX' 
                        ? `UGX ${wallet.available_balance.toLocaleString()}`
                        : `${wallet.available_balance} ${wallet.currency}`
                      }
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipient Input */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">
            {transferType === 'internal' ? 'Recipient User' : 'Recipient Address'}
          </h2>
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/30">
            {transferType === 'internal' ? (
              <div>
                <input
                  type="text"
                  value={recipientId}
                  onChange={(e) => {
                    setRecipientId(e.target.value);
                    handleRecipientSearch(e.target.value);
                  }}
                  placeholder="Enter user ID or referral code"
                  className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {recipientInfo && (
                  <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <p className="text-green-400 font-medium">Recipient Found</p>
                    </div>
                    <p className="text-white text-sm mt-1">{recipientInfo.name}</p>
                    <p className="text-gray-300 text-xs">Code: {recipientInfo.referralCode}</p>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder={`Enter ${selectedCurrency} wallet address`}
                className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Transfer Amount</h2>
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/30">
            <div className="mb-4">
              <label className="block text-blue-300 text-sm mb-2">Amount ({selectedCurrency})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                min="0"
                max={availableBalance}
                step={selectedCurrency === 'UGX' ? '1000' : '0.0001'}
              />
              <p className="text-gray-400 text-xs mt-1">
                Available: {selectedCurrency === 'UGX' 
                  ? `UGX ${availableBalance.toLocaleString()}`
                  : `${availableBalance} ${selectedCurrency}`
                }
              </p>
            </div>

            {/* Fee Information */}
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-blue-500/10 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Transfer amount:</span>
                  <span className="text-white">
                    {selectedCurrency === 'UGX' 
                      ? `UGX ${parseFloat(amount).toLocaleString()}`
                      : `${amount} ${selectedCurrency}`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Network fee:</span>
                  <span className="text-white">
                    {selectedCurrency === 'UGX' 
                      ? `UGX ${calculateFee(parseFloat(amount), selectedCurrency).toLocaleString()}`
                      : `${calculateFee(parseFloat(amount), selectedCurrency)} ${selectedCurrency}`
                    }
                  </span>
                </div>
                {selectedCurrency === 'UGX' && (
                  <div className="border-t border-blue-500/30 mt-2 pt-2 flex justify-between font-semibold">
                    <span className="text-white">Total cost:</span>
                    <span className="text-blue-400">
                      UGX {(parseFloat(amount) + calculateFee(parseFloat(amount), selectedCurrency)).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Memo (Optional) */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Memo (Optional)</h2>
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/30">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Add a note for this transfer..."
              className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-gray-400 text-xs mt-1">{memo.length}/200 characters</p>
          </div>
        </div>

        {/* Insufficient Balance Warning */}
        {amount && parseFloat(amount) > 0 && parseFloat(amount) > availableBalance && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium">Insufficient Balance</p>
            </div>
            <p className="text-gray-300 text-sm mt-1">
              You need more {selectedCurrency} to complete this transfer.
            </p>
          </div>
        )}

        {/* Transfer Button */}
        <button
          onClick={handleTransfer}
          disabled={!amount || parseFloat(amount) <= 0 || isLoading || 
            parseFloat(amount) > availableBalance ||
            (transferType === 'internal' && !recipientId) ||
            (transferType === 'external' && !recipientAddress)}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            amount && parseFloat(amount) > 0 && !isLoading &&
            parseFloat(amount) <= availableBalance &&
            ((transferType === 'internal' && recipientId) || (transferType === 'external' && recipientAddress))
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
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
            `Transfer ${amount || '0'} ${selectedCurrency}`
          )}
        </button>

        {/* Important Notes */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
          <h3 className="text-white font-medium mb-2">Important Notes:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Internal transfers are processed instantly</li>
            <li>• External transfers may take up to 30 minutes</li>
            <li>• Double-check recipient details before sending</li>
            <li>• Network fees apply for all transfers</li>
            <li>• Transfers cannot be reversed once confirmed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}