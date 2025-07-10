import React, { useState } from 'react';

interface UserInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const UserInput: React.FC<UserInputProps> = ({ onSendMessage, disabled, placeholder = "Type your topic or response..." }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-stretch space-x-2 sm:space-x-3 group overflow-safe">
      <div className="relative flex-grow min-w-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          autoCapitalize="sentences"
          autoCorrect="on"
          spellCheck="true"
          className="w-full bg-white/5 backdrop-blur-sm border border-white/10 text-slate-100 placeholder-slate-400 rounded-2xl focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400/50 focus:bg-white/10 outline-none transition-all duration-300 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl hover:bg-white/8 disabled:opacity-50 disabled:cursor-not-allowed touch-optimized overflow-safe"
          style={{ 
            height: 'var(--input-height)',
            minHeight: 'var(--touch-target-min)',
            padding: `${Math.max(12, parseInt('var(--space-md)') || 12)}px ${Math.max(48, parseInt('var(--touch-target-min)') || 48)}px ${Math.max(12, parseInt('var(--space-md)') || 12)}px ${Math.max(16, parseInt('var(--space-md)') || 16)}px`,
            fontSize: '16px' // Prevent zoom on iOS
          }}
          aria-label="User message input"
        />
        
        {/* Input decoration */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        {/* Character count or typing indicator */}
        {inputValue && (
          <div className="absolute right-12 sm:right-14 md:right-16 top-1/2 transform -translate-y-1/2 text-xs text-slate-500 font-medium hidden sm:block">
            {inputValue.length}
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={disabled || !inputValue.trim()}
        className="group relative bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-2xl hover:from-indigo-400 hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-indigo-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 disabled:hover:transform-none shadow-lg flex-shrink-0 touch-optimized"
        style={{ 
          minWidth: 'var(--touch-target-min)',
          minHeight: 'var(--touch-target-min)',
          width: 'var(--input-height)',
          height: 'var(--input-height)'
        }}
        aria-label="Send message"
      >
        {/* Button glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth="2" 
          stroke="currentColor" 
          className="w-5 h-5 sm:w-6 sm:h-6 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-white/20 rounded-2xl transform scale-0 group-active:scale-100 transition-transform duration-150"></div>
        </div>
      </button>
    </form>
  );
};