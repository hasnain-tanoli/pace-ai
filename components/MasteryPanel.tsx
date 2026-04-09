import React from 'react';

interface MasteryPanelProps {
  topic: string;
  progress: number;
  messageCount: number;
}

export const MasteryPanel: React.FC<MasteryPanelProps> = ({ topic, progress, messageCount }) => {
  return (
    <div className="flex flex-col h-full py-8 px-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-10">
        <h3 className="text-[10px] font-bold text-[var(--ink-heading)] uppercase tracking-[0.2em] font-display transition-colors duration-500">
          Intelligence
        </h3>
        <div className="flex-1 h-[1px] bg-[var(--border-muted)]"></div>
      </div>

      <div className="space-y-8">
        {/* Modern Mastery Score */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 shadow-sm text-center relative overflow-hidden group transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--bg-app)]">
             <div 
               className="h-full bg-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.3)]" 
               style={{ width: `${progress}%` }}
             ></div>
          </div>
          
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-[var(--bg-app)] relative mb-4">
             <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-[var(--bg-app)]"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray="226.2"
                  strokeDashoffset={226.2 - (226.2 * progress) / 100}
                  className="text-indigo-600 transition-all duration-1000 ease-out"
                />
             </svg>
             <span className="text-2xl font-bold font-display text-[var(--ink-heading)] group-hover:text-indigo-600 transition-colors duration-500">{progress}%</span>
          </div>
          <p className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-widest font-display transition-colors duration-500">Mastery Level</p>
        </div>

        {/* Intelligence Cards */}
        <div className="space-y-3">
          <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm transition-all duration-500">
            <span className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-widest block mb-2 font-display transition-colors duration-500">Current Subject</span>
            <p className="text-sm font-bold text-[var(--ink-heading)] leading-tight transition-colors duration-500">
              {topic ? topic : 'Finding focus...'}
            </p>
            <div className="flex items-center gap-2 mt-3 text-emerald-600">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-bold uppercase tracking-widest font-display">Active Analysis</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm transition-all duration-500">
              <span className="text-[9px] font-bold text-[var(--ink-muted)] uppercase tracking-widest block mb-1 font-display transition-colors duration-500">Signals</span>
              <p className="text-xl font-bold text-[var(--ink-heading)] font-display transition-colors duration-500">
                {messageCount > 0 ? (messageCount * 12 + Math.floor(progress * 1.5)) : 0}
              </p>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm transition-all duration-500">
              <span className="text-[9px] font-bold text-[var(--ink-muted)] uppercase tracking-widest block mb-1 font-display transition-colors duration-500">Accuracy</span>
              <p className="text-xl font-bold text-[var(--ink-heading)] font-display transition-colors duration-500">
                {messageCount > 0 ? (94 + Math.min(5, Math.floor(messageCount / 2))) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-4 pt-4">
           <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-widest font-display transition-colors duration-500">Milestones</h4>
              <div className="h-[1px] w-20 bg-[var(--border-muted)]"></div>
           </div>
           <div className="space-y-2">
              {[
                { label: 'Core Concepts', complete: progress > 30 },
                { label: 'Deep Logic', complete: progress > 60 },
                { label: 'Complex Systems', complete: progress > 90 }
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    m.complete ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-muted)] text-transparent'
                  }`}>
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeWidth="4" />
                    </svg>
                  </div>
                  <span className={`text-xs font-bold transition-colors duration-500 ${m.complete ? 'text-[var(--ink-heading)]' : 'text-[var(--ink-muted)]'}`}>
                    {m.label}
                  </span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
