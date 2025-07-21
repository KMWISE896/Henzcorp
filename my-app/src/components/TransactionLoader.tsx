import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Bitcoin, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { getCryptoAssets, createTransaction, createCryptoTrade, updateWalletBalance, updateTransactionStatus } from '../lib/supabase';
import type {CryptoAsset } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../contexts/AppContext';

interface BuyCryptoScreenProps {
  onBack: () => void;
  onSuccess?: () => Promise<void>;
  showAlert?: {
    showSuccess: (title: string, message?: string) => void;
    showError: (title: string, message?: string) => void;
    showWarning: (title: string, message?: string) => void;
    showInfo: (title: string, message?: string) => void;
  };
}

export default function BuyCryptoScreen({ onBack, onSuccess, showAlert }: BuyCryptoScreenProps) {
  const { user } = useAuth();
  const { getFiatBalance } = useAppData();
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [amountType, setAmountType] = useState<'fiat' | 'crypto'>('fiat');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [completedTrade, setCompletedTrade] = useState<{
    cryptoAmount: number;
    fiatAmount: number;
    cryptoSymbol: string;
    tradeType: 'buy' | 'sell';
  } | null>(null);

  const availableBalance = getFiatBalance();

  useEffect(() => {
    loadCryptoAssets();
  }, []);

  const loadCryptoAssets = async () => {
    try {
      setLoadingAssets(true);
      const assets = await getCryptoAssets();
      setCryptoAssets(assets);
      if (assets.length > 0) {
        setSelectedCrypto(assets[0]); // Default to first crypto (usually BTC)
      }
    } catch (error) {
      console.error('Error loading crypto assets:', error);
    } finally {
      setLoadingAssets(false);
    }
  };

  const calculateTrade = () => {
    if (!selectedCrypto || !amount || parseFloat(amount) <= 0) {
      return { cryptoAmount: 0, fiatAmount: 0, fee: 0, total: 0 };
    }

    const inputAmount = parseFloat(amount);
    const price = selectedCrypto.current_price_ugx;
    
    let cryptoAmount: number;
    let fiatAmount: number;

    if (amountType === 'fiat') {
      fiatAmount = inputAmount;
      cryptoAmount = fiatAmount / price;
    } else {
      cryptoAmount = inputAmount;
      fiatAmount = cryptoAmount * price;
    }

    const fee = Math.max(2000, fiatAmount * 0.015); // 1.5% fee, minimum 2000 UGX
    const total = tradeType === 'buy' ? fiatAmount + fee : fiatAmount - fee;

    return { cryptoAmount, fiatAmount, fee, total };
  };

  const { cryptoAmount, fiatAmount, fee, total } = calculateTrade();

  const handleTrade = async () => {
    if (!user || !selectedCrypto || !amount || parseFloat(amount) <= 0) {
      showAlert?.showWarning('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (tradeType === 'buy' && total > availableBalance) {
      showAlert?.showError('Insufficient Balance', 'Insufficient UGX balance for this purchase');
      return;
    }

    setIsLoading(true);

    try {
      // Create transaction record
      const transaction = await createTransaction({
        user_id: user.id,
        transaction_type: tradeType === 'buy' ? 'buy_crypto' : 'sell_crypto',
        currency: selectedCrypto.symbol,
        amount: cryptoAmount,
        fee: fee,
        description: `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${cryptoAmount.toFixed(8)} ${selectedCrypto.symbol}`
      });

      // Create crypto trade record
      await createCryptoTrade({
        transaction_id: transaction.id,
        user_id: user.id,
        trade_type: tradeType,
        crypto_symbol: selectedCrypto.symbol,
        crypto_amount: cryptoAmount,
        fiat_amount: fiatAmount,
        fiat_currency: 'UGX',
        price_per_unit: selectedCrypto.current_price_ugx
      });

      if (tradeType === 'buy') {
        // Deduct UGX and add crypto
        await updateWalletBalance(user.id, 'UGX', total, 'subtract');
        await updateWalletBalance(user.id, selectedCrypto.symbol, cryptoAmount, 'add');
      } else {
        // Deduct crypto and add UGX
        await updateWalletBalance(user.id, selectedCrypto.symbol, cryptoAmount, 'subtract');
        await updateWalletBalance(user.id, 'UGX', total, 'add');
      }

      // Update transaction status
      await updateTransactionStatus(transaction.id, 'completed');
      
      console.log('🔄 Refreshing data after successful crypto trade...')
      
      // Refresh app data
      if (onSuccess) {
        await onSuccess();
      }
      
      console.log('✅ Data refresh triggered')
      
      // Store the completed trade details before clearing
      setCompletedTrade({
        cryptoAmount,
        fiatAmount,
        cryptoSymbol: selectedCrypto.symbol,
        tradeType
      });
      setShowSuccess(true);
      setAmount('');
    } catch (error: any) {
      console.error('Trade error:', error);
      showAlert?.showError('Trade Failed', error.message || 'Please try again.');
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
          <h2 className="text-2xl font-bold text-white mb-4">Trade Successful!</h2>
          <p className="text-gray-300 mb-8">
            You {completedTrade?.tradeType === 'buy' ? 'bought' : 'sold'} {completedTrade?.cryptoAmount.toFixed(8)} {completedTrade?.cryptoSymbol} 
            {completedTrade?.tradeType === 'buy' ? ' for' : ' and received'} UGX {completedTrade?.fiatAmount.toLocaleString()}.
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
        <h1 className="text-xl font-semibold text-white">Buy & Sell Crypto</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
          <p className="text-green-300 text-sm mb-2">Available UGX Balance</p>
          <p className="text-white text-2xl font-bold">UGX {availableBalance.toLocaleString()}</p>
        </div>

        {/* Trade Type Selection */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Trade Type</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTradeType('buy')}
              className={`bg-gradient-to-br backdrop-blur-sm rounded-2xl p-4 border transition-all ${
                tradeType === 'buy' 
                  ? 'from-green-600/30 to-green-800/30 border-green-500/50 ring-2 ring-green-500' 
                  : 'from-gray-600/20 to-gray-800/20 border-gray-500/30 hover:bg-gray-600/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Buy Crypto</p>
                  <p className="text-gray-300 text-sm">Purchase with UGX</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setTradeType('sell')}
              className={`bg-gradient-to-br backdrop-blur-sm rounded-2xl p-4 border transition-all ${
                tradeType === 'sell' 
                  ? 'from-red-600/30 to-red-800/30 border-red-500/50 ring-2 ring-red-500' 
                  : 'from-gray-600/20 to-gray-800/20 border-gray-500/30 hover:bg-gray-600/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Sell Crypto</p>
                  <p className="text-gray-300 text-sm">Convert to UGX</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Crypto Selection */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">Select Cryptocurrency</h2>
          {loadingAssets ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading cryptocurrencies...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cryptoAssets.map((crypto) => (
                <button
                  key={crypto.id}
                  onClick={() => setSelectedCrypto(crypto)}
                  className={`w-full bg-gradient-to-br backdrop-blur-sm rounded-2xl p-4 border transition-all ${
                    selectedCrypto?.id === crypto.id
                      ? 'from-orange-600/30 to-orange-800/30 border-orange-500/50 ring-2 ring-orange-500'
                      : 'from-gray-600/20 to-gray-800/20 border-gray-500/30 hover:bg-gray-600/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <span className="text-orange-400 font-bold text-sm">{crypto.symbol}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">{crypto.name}</p>
                        <p className="text-gray-300 text-sm">{crypto.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">UGX {crypto.current_price_ugx.toLocaleString()}</p>
                      <p className={`text-sm ${crypto.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {crypto.price_change_24h >= 0 ? '+' : ''}{crypto.price_change_24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Amount Input */}
        {selectedCrypto && (
          <div>
            <h2 className="text-white font-semibold text-lg mb-4">Enter Amount</h2>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-800/30">
              {/* Amount Type Toggle */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setAmountType('fiat')}
                  className={`py-2 px-4 rounded-lg transition-all ${
                    amountType === 'fiat'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-600/20 text-gray-300 hover:bg-gray-600/30'
                  }`}
                >
                  UGX Amount
                </button>
                <button
                  onClick={() => setAmountType('crypto')}
                  className={`py-2 px-4 rounded-lg transition-all ${
                    amountType === 'crypto'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-600/20 text-gray-300 hover:bg-gray-600/30'
                  }`}
                >
                  {selectedCrypto.symbol} Amount
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-blue-300 text-sm mb-2">
                  Amount ({amountType === 'fiat' ? 'UGX' : selectedCrypto.symbol})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Enter ${amountType === 'fiat' ? 'UGX' : selectedCrypto.symbol} amount`}
                  className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                  min="0"
                  step={amountType === 'fiat' ? '1000' : '0.00000001'}
                />
              </div>

              {/* Trade Preview */}
              {amount && parseFloat(amount) > 0 && (
                <div className={`rounded-lg p-4 ${tradeType === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">
                        {tradeType === 'buy' ? 'You pay:' : 'You receive:'}
                      </span>
                      <span className="text-white">UGX {fiatAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">
                        {tradeType === 'buy' ? 'You get:' : 'You sell:'}
                      </span>
                      <span className="text-white">{cryptoAmount.toFixed(8)} {selectedCrypto.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Trading fee (1.5%):</span>
                      <span className="text-white">UGX {fee.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 flex justify-between font-semibold">
                      <span className="text-white">Total {tradeType === 'buy' ? 'cost:' : 'received:'}</span>
                      <span className={tradeType === 'buy' ? 'text-red-400' : 'text-green-400'}>
                        UGX {total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {tradeType === 'buy' && amount && parseFloat(amount) > 0 && total > availableBalance && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 font-medium">Insufficient Balance</p>
            </div>
            <p className="text-gray-300 text-sm mt-1">
              You need UGX {(total - availableBalance).toLocaleString()} more to complete this purchase.
            </p>
          </div>
        )}

        {/* Trade Button */}
        <button
          onClick={handleTrade}
          disabled={!selectedCrypto || !amount || parseFloat(amount) <= 0 || isLoading || 
            (tradeType === 'buy' && total > availableBalance)}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            selectedCrypto && amount && parseFloat(amount) > 0 && !isLoading &&
            (tradeType === 'sell' || total <= availableBalance)
              ? `bg-gradient-to-r ${tradeType === 'buy' ? 'from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600' : 'from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'} text-white`
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedCrypto?.symbol || 'Crypto'}`
          )}
        </button>

        {/* Market Info */}
        {selectedCrypto && (
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
            <h3 className="text-white font-medium mb-3">Market Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">24h Volume</p>
                <p className="text-white">UGX {selectedCrypto.volume_24h.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Market Cap</p>
                <p className="text-white">UGX {selectedCrypto.market_cap.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Important Notes */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
          <h3 className="text-white font-medium mb-2">Important Notes:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Trades are executed at current market prices</li>
            <li>• Trading fee of 1.5% applies (minimum UGX 2,000)</li>
            <li>• Crypto is stored securely in your wallet</li>
            <li>• Prices update in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}