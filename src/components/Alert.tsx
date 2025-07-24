import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

export interface AlertProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Alert({ id, type, title, message, duration = 2500, onClose }: AlertProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 250); // Faster exit animation
  };

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'from-green-600/20 to-green-800/20',
          border: 'border-green-500/50',
          icon: CheckCircle,
          iconColor: 'text-green-400',
          titleColor: 'text-green-300'
        };
      case 'error':
        return {
          bg: 'from-red-600/20 to-red-800/20',
          border: 'border-red-500/50',
          icon: XCircle,
          iconColor: 'text-red-400',
          titleColor: 'text-red-300'
        };
      case 'warning':
        return {
          bg: 'from-yellow-600/20 to-yellow-800/20',
          border: 'border-yellow-500/50',
          icon: AlertCircle,
          iconColor: 'text-yellow-400',
          titleColor: 'text-yellow-300'
        };
      case 'info':
        return {
          bg: 'from-blue-600/20 to-blue-800/20',
          border: 'border-blue-500/50',
          icon: Info,
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-300'
        };
    }
  };

  const styles = getAlertStyles();
  const Icon = styles.icon;

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-50 transform transition-all duration-300 ease-out ${
        isVisible && !isExiting
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-[-100px] opacity-0 scale-95'
      }`}
    >
      <div className={`bg-gradient-to-br ${styles.bg} backdrop-blur-sm rounded-2xl p-4 border ${styles.border} shadow-2xl`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Icon className={`w-6 h-6 ${styles.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${styles.titleColor} text-sm`}>
              {title}
            </h3>
            {message && (
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                {message}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-black/20 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              type === 'success' ? 'bg-green-400' :
              type === 'error' ? 'bg-red-400' :
              type === 'warning' ? 'bg-yellow-400' :
              'bg-blue-400'
            } transition-all ease-linear`}
            style={{
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
    </div>
  );
}