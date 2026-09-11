import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading data...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-500 mb-3`} />
      {message && <p className="text-sm font-medium text-gray-400">{message}</p>}
    </div>
  );
};
