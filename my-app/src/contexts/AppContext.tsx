import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserWallets, getUserTransactions } from '../lib/supabase';
import type {Wallet, Transaction } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';


interface AppContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  loading: boolean;
  refreshData: () => Promise<void>;
  getFiatBalance: () => number;
  getCryptoBalanceUGX: () => number;
  getWalletBalance: (currency: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppData = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppData must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    if (!user) {
      setWallets([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Refreshing all app data for user:', user.id);
      
      const [userWallets, userTransactions] = await Promise.all([
        getUserWallets(user.id),
        getUserTransactions(user.id, 50)
      ]);
      
      setWallets(userWallets);
      setTransactions(userTransactions);
      
      console.log('✅ App data refreshed:', {
        wallets: userWallets.map(w => `${w.currency}: ${w.available_balance}`),
        transactionCount: userTransactions.length
      });
    } catch (error) {
      console.error('❌ Error refreshing app data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFiatBalance = (): number => {
    const wallet = wallets.find(w => w.currency === 'UGX');
    return wallet?.available_balance || 0;
  };

  const getCryptoBalanceUGX = (): number => {
    const conversionRates: { [key: string]: number } = {
      'BTC': 165420000,
      'ETH': 8750000,
      'LTC': 380000,
      'USDT': 3700
    };
    
    return wallets
      .filter(w => w.currency !== 'UGX')
      .reduce((sum, wallet) => {
        const rate = conversionRates[wallet.currency] || 1;
        return sum + (wallet.available_balance * rate);
      }, 0);
  };

  const getWalletBalance = (currency: string): number => {
    const wallet = wallets.find(w => w.currency === currency);
    return wallet?.available_balance || 0;
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('henzcorp_')) {
        console.log('🔄 Storage changed, refreshing data...');
        refreshData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: AppContextType = {
    wallets,
    transactions,
    loading,
    refreshData,
    getFiatBalance,
    getCryptoBalanceUGX,
    getWalletBalance
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};