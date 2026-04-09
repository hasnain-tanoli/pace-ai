import React, { useState } from 'react';

interface UserInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const UserInput: React.FC<UserInputProps> = ({ onSendMessage, disabled, placeholder = "Input command or question..." }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center group w-full pointer-events-auto">
      <div className="absolute left-6 z-10 pointer-events-none transition-colors duration-300 group-focus-within:text-[var(--accent)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--ink-muted)] transition-colors group-focus-within:text-[var(--accent)]">
           <path d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z" />
        </svg>
      </div>
      
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-[var(--bg-card)] text-[var(--ink)] pl-16 pr-24 py-5 rounded-2xl focus:outline-none transition-all duration-300 text-[15px] font-semibold tracking-tight placeholder-[var(--ink-muted)] border border-[var(--border-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/5 disabled:opacity-50"
        autoComplete="off"
      />
      
      <div className="absolute right-3 flex items-center gap-3">
        {inputValue.length > 0 && (
          <span className="hidden sm:inline font-display text-[10px] font-bold text-[var(--ink-muted)] tracking-widest uppercase tabular-nums transition-colors duration-500">
            {inputValue.length} chars
          </span>
        )}
        <button
          type="submit"
          disabled={disabled || !inputValue.trim()}
          className="bg-[var(--ink-heading)] text-[var(--bg-app)] p-2.5 rounded-xl transition-all duration-300 hover:filter hover:brightness-90 disabled:opacity-20 active:scale-95 shadow-lg shadow-indigo-500/10"
          aria-label="Send message"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth="3" 
            stroke="currentColor" 
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l7-7-7-7M5 12h14" />
          </svg>
        </button>
      </div>
    </form>
  );
};