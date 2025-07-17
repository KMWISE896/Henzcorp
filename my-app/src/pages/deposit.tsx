import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PaymentMethod = {
  id: string;
  name: string;
};

const paymentOptions: Record<string, PaymentMethod[]> = {
  UGX: [
    { id: 'mtn', name: 'MTN Mobile Money' },
    { id: 'airtel', name: 'Airtel Money' },
  ],
  KES: [
    { id: 'mpesa', name: 'M-Pesa' },
  ],
  TZS: [
    { id: 'tigo', name: 'Tigo Pesa' },
    { id: 'vodacom', name: 'Vodacom M-Pesa' },
    { id: 'airtel', name: 'Airtel Money' },
  ],
};

function Deposit() {
  const [currency, setCurrency] = useState('UGX');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [balance, setBalance] = useState(900000);
  const navigate = useNavigate();

  const handleDeposit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return alert('Enter a valid amount');
    if (!selectedMethod) return alert('Please select a payment method');
    setBalance(balance + amt);
    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center space-x-2">
        <button onClick={() => navigate(-1)} className="text-blue-400 hover:text-blue-600">
          <ArrowLeft />
        </button>
        <h2 className="text-xl font-semibold">Deposit Funds</h2>
      </div>

      {/* Currency Selector */}
      <div className="bg-black/20 backdrop-blur-sm p-6 rounded-2xl border border-blue-800/30 mb-6">
        <label className="block mb-2 text-sm text-blue-300">Currency</label>
        <select
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value);
            setSelectedMethod(null); // reset method on currency change
          }}
          className="w-full p-2 rounded-md bg-slate-800 text-white focus:outline-none"
        >
          <option value="UGX">UGX - Uganda Shillings</option>
          <option value="KES">KES - Kenyan Shillings</option>
          <option value="TZS">TZS - Tanzanian Shillings</option>
        </select>
      </div>

      {/* Amount Input */}
      <div className="bg-black/20 backdrop-blur-sm p-6 rounded-2xl border border-blue-800/30 mb-6">
        <label className="block mb-2 text-sm text-blue-300">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter amount in ${currency}`}
          className="w-full p-3 rounded-md bg-slate-800 text-white focus:outline-none"
        />
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <p className="mb-2 text-sm text-blue-300">Select Payment Method</p>
        {paymentOptions[currency]?.map((method) => (
          <div
            key={method.id}
            className={`p-4 rounded-md mb-3 cursor-pointer transition-colors border ${
              selectedMethod === method.id
                ? 'bg-blue-600 border-blue-400'
                : 'bg-slate-800 hover:bg-slate-700 border-transparent'
            }`}
            onClick={() => setSelectedMethod(method.id)}
          >
            {method.name}
          </div>
        ))}
      </div>

      {/* Deposit Button */}
      <button
        onClick={handleDeposit}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-full shadow-md transition-colors"
      >
        Deposit Now
      </button>

      {/* Success Popup */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-2xl text-center max-w-sm border border-blue-500">
            <h3 className="text-xl font-bold text-green-400 mb-4">Deposit Successful!</h3>
            <p className="mb-2 text-white">Your new balance is:</p>
            <p className="text-lg font-semibold text-blue-300">
              {currency} {balance.toLocaleString()}
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-6 bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-full"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Deposit;
