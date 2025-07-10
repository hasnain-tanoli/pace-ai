import React from 'react';

interface ActionButtonsProps {
  onYes: () => void;
  onNo: () => void;
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onYes, onNo, disabled }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-3 overflow-safe">
      <button
        onClick={onYes}
        disabled={disabled}
        className="group relative w-full sm:w-auto bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/20 text-slate-100 font-semibold rounded-xl hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:ring-offset-1 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm sm:text-base flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-0.5 touch-optimized overflow-safe"
        style={{ 
          minHeight: 'var(--touch-target-preferred)',
          padding: 'var(--space-md) var(--space-lg)'
        }}
        aria-label="Confirm understanding (Yes)"
      >
        {/* Button glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span className="relative truncate">Yes, I understand</span>
      </button>
      
      <button
        onClick={onNo}
        disabled={disabled}
        className="group relative w-full sm:w-auto bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-400/20 text-slate-100 font-semibold rounded-xl hover:from-amber-500/30 hover:to-orange-500/30 hover:border-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-1 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm sm:text-base flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-0.5 touch-optimized overflow-safe"
        style={{ 
          minHeight: 'var(--touch-target-preferred)',
          padding: 'var(--space-md) var(--space-lg)'
        }}
        aria-label="Request different explanation (No)"
      >
        {/* Button glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-400 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
        <span className="relative truncate">I'm confused</span>
      </button>
    </div>
  );
};