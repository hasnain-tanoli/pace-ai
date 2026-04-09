import React from 'react';

interface SyllabusRoadmapProps {
  syllabus: string[];
  currentIndex: number;
}

export const SyllabusRoadmap: React.FC<SyllabusRoadmapProps> = ({ syllabus, currentIndex }) => {
  if (!syllabus || syllabus.length === 0) return null;

  return (
    <div className="w-full bg-white/40 py-8 px-6 sm:px-8 border-x border-stone-200/30">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10 overflow-hidden">
          <div className="flex flex-col gap-1">
            <h3 className="text-[11px] font-black text-stone-900 uppercase tracking-[0.1em]">
              Syllabus Architecture
            </h3>
            <div className="h-[1px] w-12 bg-stone-900"></div>
          </div>
          <div className="font-mono text-[9px] font-bold text-stone-900 bg-stone-100/50 border border-stone-200 px-3 py-1 rounded tracking-[0.1em] shadow-sm">
            MODULE [{String(currentIndex + 1).padStart(2, '0')}] OF [{String(syllabus.length).padStart(2, '0')}]
          </div>
        </div>
        
        <div className="relative flex items-center justify-between">
          {/* Main Blueprint Line (Architectural) */}
          <div className="absolute top-5 left-0 right-0 h-[0.5px] bg-stone-200 z-0" />
          
          {/* Active Highlight Line */}
          <div 
            className="absolute top-5 left-0 h-[1.5px] bg-stone-900 transition-all duration-1000 ease-in-out z-0 shadow-[0_0_10px_rgba(0,0,0,0.1)]" 
            style={{ width: `${(currentIndex / Math.max(1, syllabus.length - 1)) * 100}%` }}
          />

          {syllabus.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;

            return (
              <div key={index} className="flex flex-col items-center relative z-10">
                {/* Architectural Node */}
                <div 
                  className={`w-10 h-10 rounded-full border transition-all duration-500 flex items-center justify-center font-mono ${
                    isCompleted 
                      ? 'bg-stone-900 border-stone-900 text-white shadow-lg' 
                      : isActive 
                        ? 'bg-white border-2 border-stone-900 text-stone-900 scale-110 shadow-xl' 
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-[11px] font-extrabold">{String(index + 1).padStart(2, '0')}</span>
                  )}
                  
                  {/* Active Pulse Mark */}
                  {isActive && (
                    <div className="absolute -inset-1 rounded-full border border-stone-900 animate-ping opacity-20"></div>
                  )}
                </div>
                
                {/* Architectural Label */}
                <div className="h-4 w-[1px] bg-stone-200 mt-3 hidden sm:block"></div>
                <span className={`static mt-3 text-center text-[10px] font-bold tracking-tight transition-colors duration-500 max-w-[120px] break-words uppercase leading-tight ${
                  isActive ? 'text-stone-900' : isCompleted ? 'text-stone-700' : 'text-stone-600'
                }`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
