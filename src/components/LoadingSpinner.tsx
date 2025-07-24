import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'white';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    purple: 'border-purple-500',
    orange: 'border-orange-500',
    white: 'border-white'
  };

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}></div>
        <div className={`absolute inset-0 ${sizeClasses[size]} ${colorClasses[color]} border-2 border-r-transparent rounded-full animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      {text && (
        <span className="text-white font-medium animate-pulse">{text}</span>
      )}
    </div>
  );
}