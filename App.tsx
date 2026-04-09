import React, { useState, useEffect, useRef } from 'react';
import { LearningPhase } from './types';
import { AI_TUTOR_NAME } from './constants';
import { ChatBubble } from './components/ChatBubble';
import { UserInput } from './components/UserInput';
import { QuizDisplay } from './components/QuizDisplay';
import { ActionButtons } from './components/ActionButtons';
import { SyllabusSidebar } from './components/SyllabusSidebar';
import { MasteryPanel } from './components/MasteryPanel';
import { useTutor } from './hooks/useTutor';
import { exportStudyGuide } from './utils/exportStudyGuide';

const App: React.FC<{}> = () => {
  const { state, actions } = useTutor();
  const { chatMessages, currentQuiz, syllabus, currentSyllabusIndex, currentTopic, learningPhase, isLoading, error } = state;
  const { handleUserMessage, handleUnderstandingResponse, handleQuizSubmit, handleStartNewTopic, handleExplanationRetry, handleSyllabusPreference } = actions;

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [chatMessages]);

  if (learningPhase === LearningPhase.DISPLAYING_QUIZ && currentQuiz) {
    return (
      <QuizDisplay
        questions={currentQuiz}
        onSubmit={handleQuizSubmit}
        isSubmitting={isLoading}
      />
    );
  }

  const progressPercentage = syllabus ? Math.round(((currentSyllabusIndex) / syllabus.length) * 100) : 0;

  return (
    <div className="flex h-screen w-full bg-[var(--bg-app)] font-sans antialiased text-[var(--ink)] overflow-hidden transition-colors duration-500">
      {/* Left Sidebar: Integrated Curriculum */}
      <aside className="hidden lg:flex w-[280px] flex-shrink-0 border-r border-[var(--border-muted)] bg-[var(--bg-sidebar)] backdrop-blur-sm z-50 transition-colors duration-500">
        <SyllabusSidebar syllabus={syllabus || []} currentIndex={currentSyllabusIndex} />
      </aside>

      {/* Center: Main Learning Flow */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="flex-shrink-0 h-[72px] bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-muted)] py-4 px-8 flex justify-between items-center z-[100] transition-colors duration-500">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative z-10">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="font-display font-bold text-lg tracking-tight text-[var(--ink-heading)] leading-none transition-colors duration-500">
                {AI_TUTOR_NAME}
              </h1>
              <span className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-widest mt-1 transition-colors duration-500">Personal Learning Assistant</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--border)] bg-[var(--bg-card)] text-[var(--ink)] hover:bg-[var(--slate-100)] dark:hover:bg-[var(--slate-800)] transition-all duration-300"
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
             </button>

             <button
              onClick={handleStartNewTopic}
              className="btn-saas-secondary !py-2 !px-4 text-xs"
            >
              Reset Session
            </button>
            <button
                onClick={() => exportStudyGuide(currentTopic, chatMessages, syllabus)}
                className="btn-saas-primary !py-2 !px-4 text-xs shadow-lg shadow-indigo-500/10"
                title="Save as PDF"
              >
                Export PDF
            </button>
          </div>
        </header>

        {/* Chat Stream / Launchpad */}
        <div className="flex-1 overflow-y-auto pt-10 pb-40 px-6 sm:px-12 scroll-smooth no-scrollbar">
          <div className="max-w-3xl mx-auto">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-up">
                <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center text-indigo-600 mb-4 animate-pulse">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                    <path d="M2 17L12 22L22 17" />
                    <path d="M2 12L12 17L22 12" />
                  </svg>
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-display font-extrabold tracking-tight text-[var(--ink-heading)]">
                    Initiate Knowledge <span className="text-indigo-600">Sync</span>
                  </h2>
                  <p className="text-lg text-[var(--ink-muted)] max-w-md mx-auto font-medium">
                    Your AI-powered tutor is primed and ready. Select a neural node to begin your session.
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  {[
                    "Quantum Entanglement",
                    "React Server Components",
                    "Existential Philosophy",
                    "Market Microstructure",
                  ].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleUserMessage(topic)}
                      className="px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm font-bold text-[var(--ink)] hover:border-indigo-500 hover:text-indigo-600 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                {chatMessages.map((msg, index) => (
                  <div key={msg.id} className="animate-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <ChatBubble message={msg} />
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-center gap-4 py-6 px-10 bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-2xl w-fit shadow-sm animate-pulse transition-colors duration-500">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs font-semibold text-[var(--ink-muted)] tracking-wide font-display text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">Syncing Intelligence...</span>
                  </div>
                )}

                {error && !isLoading && (
                  <div className="p-6 bg-red-50/50 border border-red-100 rounded-2xl animate-fade-up shadow-sm">
                    <div className="flex gap-4">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-red-900 leading-relaxed">{error}</p>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Input Shell */}
        <div className="absolute bottom-6 left-0 right-0 px-8 z-[100]">
          <div className="max-w-3xl mx-auto">
            {(learningPhase === LearningPhase.AWAITING_TOPIC ||
              learningPhase === LearningPhase.AWAITING_UNDERSTANDING_CONFIRMATION ||
              learningPhase === LearningPhase.AWAITING_SYLLABUS_PREFERENCE) && !isLoading && (
                <div className="animate-fade-up">
                  {learningPhase === LearningPhase.AWAITING_TOPIC && (
                    <div className="silk-card p-1 shadow-floating">
                      <UserInput onSendMessage={handleUserMessage} disabled={isLoading} placeholder="What do you want to learn today?" />
                    </div>
                  )}
                  {learningPhase === LearningPhase.AWAITING_UNDERSTANDING_CONFIRMATION && (
                    <div className="silk-card p-6 shadow-floating text-center space-y-4">
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-widest font-display">Is this explanation clear?</p>
                      <ActionButtons
                        onYes={() => handleUnderstandingResponse(true)}
                        onNo={handleExplanationRetry}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  {learningPhase === LearningPhase.AWAITING_SYLLABUS_PREFERENCE && (
                    <div className="silk-card p-6 shadow-floating text-center space-y-4">
                      <p className="text-sm font-semibold text-slate-600 uppercase tracking-widest font-display">How should we proceed?</p>
                      <ActionButtons
                        onYes={() => handleSyllabusPreference(true)}
                        onNo={() => handleSyllabusPreference(false)}
                        yesLabel="Structured Course"
                        noLabel="Freeform Chat"
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </main>

      {/* Right Sidebar: Intelligence Dashboard */}
      <aside className="hidden xl:flex w-[320px] flex-shrink-0 border-l border-[var(--border-muted)] bg-[var(--bg-sidebar)] backdrop-blur-sm z-50 transition-colors duration-500">
        <MasteryPanel 
          topic={currentTopic} 
          progress={progressPercentage} 
          messageCount={chatMessages.length} 
        />
      </aside>
    </div>
  );
};

export default App;
