import React, { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';

interface DepositScreenProps {
  onBack: () => void;
}

export default function DepositScreen({ onBack }: DepositScreenProps) {
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [currency, setCurrency] = useState('UGX - Uganda Shillings');

  const paymentMethods = [
    { id: 'mtn', name: 'MTN Mobile Money', color: 'bg-yellow-600' },
    { id: 'airtel', name: 'Airtel Money', color: 'bg-red-600' }
  ];

  const handleDeposit = () => {
    if (amount && selectedPaymentMethod) {
      // Handle deposit logic here
      alert(`Depositing ${amount} UGX via ${selectedPaymentMethod}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
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
        {/* Currency Selection */}
        <div>
          <label className="block text-blue-300 text-sm mb-3">Currency</label>
          <div className="relative">
            <select 
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl px-4 py-4 text-white appearance-none cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="UGX - Uganda Shillings">UGX - Uganda Shillings</option>
              <option value="USD - US Dollars">USD - US Dollars</option>
              <option value="EUR - Euros">EUR - Euros</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-blue-300 text-sm mb-3">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount in UGX"
            className="w-full bg-black/30 backdrop-blur-sm border border-blue-800/30 rounded-2xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Payment Methods */}
        <div>
          <label className="block text-blue-300 text-sm mb-3">Select Payment Method</label>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.name)}
                className={`w-full p-4 rounded-2xl text-left font-medium transition-all ${
                  selectedPaymentMethod === method.name
                    ? 'bg-blue-600 border-2 border-blue-400'
                    : 'bg-black/30 backdrop-blur-sm border border-blue-800/30 hover:bg-black/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${method.color} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">
                      {method.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-white">{method.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Deposit Button */}
        <div className="pt-8">
          <button
            onClick={handleDeposit}
            disabled={!amount || !selectedPaymentMethod}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
              amount && selectedPaymentMethod
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Deposit Now
          </button>
        </div>

        {/* Additional Info */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30 mt-6">
          <h3 className="text-white font-medium mb-2">Important Notes:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Minimum deposit amount is UGX 1,000</li>
            <li>• Deposits are processed instantly</li>
            <li>• No fees for mobile money deposits</li>
            <li>• Ensure your mobile money account has sufficient balance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}