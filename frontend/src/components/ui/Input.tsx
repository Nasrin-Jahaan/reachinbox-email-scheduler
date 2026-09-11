import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-gray-900 border ${
              error ? 'border-rose-500 focus:ring-rose-500' : 'border-gray-800 focus:border-indigo-500 focus:ring-indigo-500'
            } rounded-lg py-2.5 ${icon ? 'pl-10' : 'px-3.5'} pr-3.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-gray-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
