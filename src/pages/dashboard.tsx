import React, { useState } from 'react';
import { Plus, Download, Smartphone, ArrowUpRight, Home, TrendingUp, DollarSign, User, Users } from 'lucide-react';
import DepositButton from '../components/DepositButton';
function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');

  const transactions = [
    {
      id: 1,
      type: 'purchase',
      title: 'You purchased Airtime',
      amount: 'UGX 617.40',
      description: 'Sent UGX 630.00 worth of airtime to +256 701 867698 (Home Data). You saved UGX 12.60!',
      time: 'Jun 8 at 3:02 PM',
      icon: 'D',
      iconColor: 'bg-green-500'
    },
    {
      id: 2,
      type: 'sale',
      title: 'You sold Litecoin',
      amount: 'UGX 634.20',
      description: 'Sold 0.00200000 LTC',
      time: 'Jun 8 at 3:02 PM',
      icon: 'L',
      iconColor: 'bg-blue-500'
    },
    {
      id: 3,
      type: 'transfer',
      title: 'You sent Litecoin',
      amount: '0.43000000 LTC',
      description: '',
      time: 'Jun 8 at 3:02 PM',
      icon: 'L',
      iconColor: 'bg-blue-500'
    }
  ];

  const chartData = [
    { value: 120, color: 'bg-green-400' },
    { value: 80, color: 'bg-red-400' },
    { value: 150, color: 'bg-green-400' },
    { value: 100, color: 'bg-red-400' },
    { value: 180, color: 'bg-green-400' },
    { value: 90, color: 'bg-red-400' },
    { value: 140, color: 'bg-green-400' },
    { value: 110, color: 'bg-red-400' },
    { value: 160, color: 'bg-green-400' },
    { value: 130, color: 'bg-red-400' },
    { value: 200, color: 'bg-green-400' },
    { value: 95, color: 'bg-red-400' },
    { value: 175, color: 'bg-green-400' },
    { value: 120, color: 'bg-red-400' },
    { value: 190, color: 'bg-green-400' },
    { value: 85, color: 'bg-red-400' },
    { value: 155, color: 'bg-green-400' },
    { value: 105, color: 'bg-red-400' },
    { value: 170, color: 'bg-green-400' },
    { value: 125, color: 'bg-red-400' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-300 mb-6">HENZCORP</h1>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
            <p className="text-blue-300 text-sm mb-1">Your Balance:</p>
            <p className="text-white text-lg font-semibold">UGX 900,000.00</p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
            <p className="text-blue-300 text-sm mb-1">Crypto Balance:</p>
            <p className="text-white text-lg font-semibold">UGX 1,921,000.56</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div>
              <DepositButton />
            </div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 hover:bg-blue-600 transition-colors cursor-pointer">
              <Download className="w-6 h-6 text-white" />
            </div>
            <p className="text-white text-sm">Withdraw</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 hover:bg-blue-600 transition-colors cursor-pointer">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <p className="text-white text-sm">Airtime</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 hover:bg-blue-600 transition-colors cursor-pointer">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
            <p className="text-white text-sm">Transfer</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl p-6 mb-6 border border-blue-800/30 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-end justify-center space-x-1 mb-4 relative z-10">
            {chartData.map((bar, index) => (
              <div
                key={index}
                className={`w-3 ${bar.color} rounded-t-sm transition-all duration-300 hover:opacity-80`}
                style={{ height: `${bar.value / 3}px` }}
              />
            ))}
          </div>
          
          {/* Crypto Coins */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -top-2 -left-4 w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center transform rotate-12 shadow-lg">
                <span className="text-white font-bold text-sm">₿</span>
              </div>
              <div className="absolute top-4 left-8 w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center transform -rotate-6 shadow-lg">
                <span className="text-white font-bold text-xs">E</span>
              </div>
              <div className="absolute top-8 -right-6 w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center transform rotate-45 shadow-lg">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <div className="absolute -bottom-2 right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center transform -rotate-12 shadow-lg">
                <span className="text-white font-bold text-xs">L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mb-20">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-800/30">
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 ${transaction.iconColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold">{transaction.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-white">{transaction.title}</h3>
                      <span className="text-green-400 font-semibold">{transaction.amount}</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">{transaction.time}</p>
                    {transaction.description && (
                      <p className="text-gray-300 text-sm">{transaction.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Refer & Earn Button */}
      <div className="fixed bottom-24 right-6 z-10">
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-colors">
          REFER & EARN
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-blue-800/30">
        <div className="grid grid-cols-4 py-3">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center space-y-1 py-2 ${activeTab === 'home' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">HOME</span>
          </button>
          <button
            onClick={() => setActiveTab('invest')}
            className={`flex flex-col items-center space-y-1 py-2 ${activeTab === 'invest' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">INVEST</span>
          </button>
          <button
            onClick={() => setActiveTab('earn')}
            className={`flex flex-col items-center space-y-1 py-2 ${activeTab === 'earn' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-xs">EARN</span>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center space-y-1 py-2 ${activeTab === 'account' ? 'text-blue-400' : 'text-gray-400'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">ACCOUNT</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;