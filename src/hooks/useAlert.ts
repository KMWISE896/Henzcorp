import { useState, useCallback } from 'react';

export interface AlertData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const useAlert = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  const showAlert = useCallback((alert: Omit<AlertData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert: AlertData = {
      id,
      duration: 2500, // Reduced from 5 seconds to 2.5 seconds
      ...alert
    };

    setAlerts(prev => [...prev, newAlert]);
    return id;
  }, []);

  const hideAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    return showAlert({ type: 'success', title, message, duration: duration || 2000 });
  }, [showAlert]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    return showAlert({ type: 'error', title, message, duration: duration || 3000 });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    return showAlert({ type: 'warning', title, message, duration: duration || 2500 });
  }, [showAlert]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    return showAlert({ type: 'info', title, message, duration: duration || 2500 });
  }, [showAlert]);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAllAlerts
  };
};