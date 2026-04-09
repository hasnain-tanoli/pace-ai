import React, { useState } from 'react';
import { QuizQuestion, UserAnswer } from '../types';

interface QuizDisplayProps {
  questions: QuizQuestion[];
  onSubmit: (answers: UserAnswer[]) => void;
  isSubmitting?: boolean;
}

export const QuizDisplay: React.FC<QuizDisplayProps> = ({ questions, onSubmit, isSubmitting }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [quizError, setQuizError] = useState<string | null>(null);

  const handleOptionChange = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
    setQuizError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(selectedAnswers).length === questions.length && !isSubmitting) {
      setQuizError(null);
      const formattedAnswers: UserAnswer[] = questions.map((_, index) => ({
        questionIndex: index,
        selectedOptionIndex: selectedAnswers[index] ?? -1 
      }));
      onSubmit(formattedAnswers);
    } else if (!isSubmitting) {
      setQuizError("Please answer all questions before submitting.");
    }
  };

  const progress = (Object.keys(selectedAnswers).length / questions.length) * 100;

  return (
    <form 
      onSubmit={handleSubmit} 
      className="fixed inset-0 z-[100] flex flex-col w-full h-full bg-[var(--bg-app)] animate-fade-up transition-colors duration-500"
    > 
      {/* Header */}
      <div className="bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-muted)] py-8 px-8 flex justify-between items-center transition-colors duration-500">
        <div className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-2xl text-[var(--ink-heading)] tracking-tight transition-colors duration-500">
              Knowledge Check
            </h3>
            <p className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-[0.2em] font-display transition-colors duration-500">
              Verified Session Assessment • {Object.keys(selectedAnswers).length}/{questions.length} Complete
            </p>
          </div>
          
          <div className="flex-1 max-w-[240px] h-2 bg-[var(--border-muted)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.2)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Questions Area */}
      <div className="flex-1 overflow-y-auto py-16 px-8 no-scrollbar bg-[radial-gradient(var(--border)_0.5px,transparent_0.5px)] bg-[length:32px_32px] transition-colors duration-500">
        <div className="max-w-4xl mx-auto space-y-20">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="animate-fade-up" style={{ animationDelay: `${qIndex * 0.1}s` }}>
              <div className="flex items-start gap-8">
                {/* Question Node */}
                <div className="flex-shrink-0 w-12 h-12 bg-[var(--bg-card)] border border-[var(--border-muted)] rounded-2xl flex items-center justify-center font-display font-bold text-sm text-[var(--ink-muted)] shadow-sm transition-colors duration-500">
                  {String(qIndex + 1).padStart(2, '0')}
                </div>
                
                <div className="flex-grow space-y-10">
                  <h4 className="font-display font-bold text-xl text-[var(--ink-heading)] leading-tight transition-colors duration-500">
                    {q.questionText}
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {q.options.map((option, oIndex) => (
                      <label 
                        key={oIndex} 
                        className={`flex items-center px-8 py-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                          selectedAnswers[qIndex] === oIndex 
                            ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-xl shadow-indigo-500/20 translate-x-1' 
                            : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[var(--bg-app)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={oIndex}
                          checked={selectedAnswers[qIndex] === oIndex}
                          onChange={() => handleOptionChange(qIndex, oIndex)}
                          className="sr-only"
                        />
                        <span className="text-base font-semibold leading-relaxed">
                          {option}
                        </span>
                        
                        {selectedAnswers[qIndex] === oIndex && (
                          <div className="ml-auto">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {quizError && (
            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center gap-4 text-red-900 animate-fade-up shadow-sm">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold uppercase tracking-widest font-display">{quizError}</span>
            </div>
          )}
          
          <div className="h-24" />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border-muted)] bg-[var(--bg-header)] backdrop-blur-md py-10 px-8 transition-colors duration-500">
        <div className="max-w-4xl mx-auto">
          <button
            type="submit"
            disabled={isSubmitting || Object.keys(selectedAnswers).length !== questions.length}
            className="w-full py-5 bg-[var(--ink-heading)] text-[var(--bg-app)] font-display font-bold text-sm tracking-[0.2em] rounded-2xl hover:filter hover:brightness-90 disabled:opacity-30 transition-all duration-500 flex items-center justify-center gap-4 shadow-xl shadow-indigo-500/10 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-[var(--bg-app)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-[var(--bg-app)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-[var(--bg-app)] rounded-full animate-bounce"></div>
              </div>
            ) : (
              "FINALIZE KNOWLEDGE CHECK"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};