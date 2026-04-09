import React from 'react';

interface ActionButtonsProps {
  onYes: () => void;
  onNo: () => void;
  disabled?: boolean;
  yesLabel?: string;
  noLabel?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onYes, onNo, disabled, yesLabel, noLabel }) => {
  return (
    <div className="flex gap-4 w-full animate-fade-up">
      <button
        onClick={onYes}
        disabled={disabled}
        className="btn-saas-primary flex-1 py-4 text-[13px] tracking-[0.05em]"
      >
        {yesLabel || "YES, I UNDERSTAND"}
      </button>
      
      <button
        onClick={onNo}
        disabled={disabled}
        className="btn-saas-secondary flex-1 py-4 text-[13px] tracking-[0.05em]"
      >
        {noLabel || "STILL CONFUSED"}
      </button>
    </div>
  );
};