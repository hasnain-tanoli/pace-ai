import React from 'react';

interface SyllabusSidebarProps {
  syllabus: string[];
  currentIndex: number;
}

export const SyllabusSidebar: React.FC<SyllabusSidebarProps> = ({ syllabus, currentIndex }) => {
  if (!syllabus || syllabus.length === 0) return (
    <div className="flex flex-col h-full p-8 items-center justify-center text-center">
       <div className="w-12 h-12 bg-[var(--bg-app)] rounded-2xl flex items-center justify-center text-[var(--ink-muted)] mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
       </div>
       <p className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-widest font-display transition-colors duration-500">Wait for topic...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full py-8 px-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-10">
        <h3 className="text-[10px] font-bold text-[var(--ink-heading)] uppercase tracking-[0.2em] font-display transition-colors duration-500">
          Curriculum
        </h3>
        <div className="flex-1 h-[1px] bg-[var(--border-muted)]"></div>
      </div>

      <div className="space-y-4">
        {syllabus.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <div key={index} className={`group relative p-4 rounded-2xl transition-all duration-500 ${
              isActive ? 'bg-[var(--bg-card)] shadow-md border border-[var(--border)] ring-1 ring-black/5' : 'hover:bg-[var(--bg-app)]/50'
            }`}>
              <div className="flex items-start gap-4">
                {/* Clean Indicator */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                    : isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-[var(--bg-app)] text-[var(--ink-muted)] border border-[var(--border-muted)]'
                }`}>
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : index + 1}
                </div>

                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}>
                    Module {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className={`text-[13px] font-bold tracking-tight leading-snug line-clamp-2 transition-colors duration-500 ${
                    isActive ? 'text-[var(--ink-heading)]' : isCompleted ? 'text-[var(--ink)]' : 'text-[var(--ink-muted)]'
                  }`}>
                    {step}
                  </p>
                </div>
              </div>
              
              {/* Connector Line (Internal) */}
              {index < syllabus.length - 1 && (
                 <div className="absolute left-[31px] top-[48px] w-[2px] h-[16px] bg-[var(--border-muted)] transition-all duration-500"></div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <div className="p-5 bg-[var(--bg-app)] dark:bg-indigo-500/10 border border-[var(--border)] rounded-2xl shadow-sm relative overflow-hidden group transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:rotate-12 transition-transform duration-700 text-indigo-600 dark:text-white">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7L12 12L22 7L12 2V17L12 22L2 17" />
              </svg>
          </div>
          <div className="relative z-10">
            <div className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-[0.2em] mb-1 transition-colors duration-500">Session Progress</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold font-display text-[var(--ink-heading)] transition-colors duration-500">
                {syllabus.length > 0 ? Math.round(((currentIndex) / syllabus.length) * 100) : 0}%
              </span>
              <div className="h-6 w-1 bg-indigo-500 rounded-full mb-1 transition-colors duration-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
