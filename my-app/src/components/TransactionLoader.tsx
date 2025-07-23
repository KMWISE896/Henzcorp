import React from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TransactionLoaderProps {
  isVisible: boolean;
  status: 'loading' | 'success' | 'error';
  title?: string;
  message?: string;
  onClose?: () => void;
  duration?: number;
}

export default function TransactionLoader({ 
  isVisible, 
  status, 
  title, 
  message, 
  onClose,
  duration = 3000 
}: TransactionLoaderProps) {
  React.useEffect(() => {
    if (status === 'success' && onClose && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [status, onClose, duration]);

  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      default:
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'from-blue-600/20 to-blue-800/20 border-blue-500/30';
      case 'success':
        return 'from-green-600/20 to-green-800/20 border-green-500/30';
      case 'error':
        return 'from-red-600/20 to-red-800/20 border-red-500/30';
      default:
        return 'from-blue-600/20 to-blue-800/20 border-blue-500/30';
    }
  };

  const getDefaultTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processing Transaction...';
      case 'success':
        return 'Transaction Successful!';
      case 'error':
        return 'Transaction Failed';
      default:
        return 'Processing...';
    }
  };

  const getDefaultMessage = () => {
    switch (status) {
      case 'loading':
        return 'Please wait while we process your transaction.';
      case 'success':
        return 'Your transaction has been completed successfully.';
      case 'error':
        return 'Something went wrong. Please try again.';
      default:
        return 'Please wait...';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-6">
      <div className={`bg-gradient-to-br ${getStatusColor()} backdrop-blur-sm rounded-2xl p-8 border max-w-sm w-full text-center`}>
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>
        
        <h2 className="text-xl font-bold text-white mb-4">
          {title || getDefaultTitle()}
        </h2>
        
        <p className="text-gray-300 mb-6">
          {message || getDefaultMessage()}
        </p>

        {status !== 'loading' && onClose && (
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-6 py-3 rounded-xl font-semibold text-white transition-all"
          >
            Continue
          </button>
        )}

        {status === 'loading' && (
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}