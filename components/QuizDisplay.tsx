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
      className="fixed inset-0 z-modal flex flex-col mobile-vh-fix w-full overflow-hidden safe-all ios-vh-fix"
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #111116 50%, #1a1a24 100%)',
      }}
    > 
      {/* Header */}
      <div className="relative backdrop-blur-xl border-b border-white/10 bg-black/20 flex-shrink-0 safe-top"
           style={{ padding: 'var(--space-md)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10"></div>
        <div className="relative container max-w-4xl mx-auto">
          <h3 className="font-bold text-center mb-3 sm:mb-4 overflow-safe"
              style={{ fontSize: 'var(--font-size-2xl)' }}>
            <span className="text-gradient flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mr-2 sm:mr-3 text-indigo-400 flex-shrink-0"
                   style={{ width: 'var(--font-size-xl)', height: 'var(--font-size-xl)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              Quiz Time!
            </span>
          </h3>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full backdrop-blur-sm"
               style={{ height: '0.5rem' }}>
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${progress}%`, height: '0.5rem' }}
            ></div>
          </div>
          <p className="text-center text-slate-400 font-medium overflow-safe"
             style={{ 
               fontSize: 'var(--font-size-xs)',
               marginTop: 'var(--space-xs)'
             }}>
            {Object.keys(selectedAnswers).length} of {questions.length} questions answered
          </p>
        </div>
      </div>

      {/* Questions */}
      <div className="flex-grow overflow-y-auto mobile-scroll overflow-safe"
           style={{
             padding: 'var(--space-md)',
             background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.8) 0%, rgba(17, 17, 22, 0.9) 100%)',
             backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)'
           }}>
        <div className="container max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="group">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:shadow-xl hover:bg-white/8 transition-all duration-300 overflow-safe"
                   style={{ padding: 'var(--space-md)' }}>
                <div className="flex items-start mb-3 sm:mb-4">
                  <div className="flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                       style={{ 
                         width: 'var(--touch-target-min)',
                         height: 'var(--touch-target-min)',
                         fontSize: 'var(--font-size-sm)',
                         marginRight: 'var(--space-md)'
                       }}>
                    {qIndex + 1}
                  </div>
                  <p className="font-semibold text-slate-100 leading-relaxed overflow-safe min-w-0 flex-1"
                     style={{ fontSize: 'var(--font-size-base)' }}>
                    {q.questionText}
                  </p>
                </div>
                
                <div className="space-y-2 sm:space-y-3"
                     style={{ marginLeft: 'calc(var(--touch-target-min) + var(--space-md))' }}>
                  {q.options.map((option, oIndex) => (
                    <label 
                      key={oIndex} 
                      className={`group/option flex items-center rounded-xl transition-all duration-300 cursor-pointer border backdrop-blur-sm touch-optimized overflow-safe
                                  ${selectedAnswers[qIndex] === oIndex 
                                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-400/40 shadow-lg shadow-indigo-500/10' 
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'} 
                                `}
                      style={{ padding: 'var(--space-md)' }}
                    >
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={oIndex}
                          checked={selectedAnswers[qIndex] === oIndex}
                          onChange={() => handleOptionChange(qIndex, oIndex)}
                          className="sr-only"
                          aria-label={`Option ${oIndex + 1} for question ${qIndex + 1}`}
                        />
                        <div className={`rounded-full border-2 flex items-center justify-center transition-all duration-300
                                        ${selectedAnswers[qIndex] === oIndex 
                                          ? 'border-indigo-400 bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg' 
                                          : 'border-slate-400 group-hover/option:border-slate-300'}`}
                             style={{ 
                               width: '1.25rem',
                               height: '1.25rem'
                             }}>
                          {selectedAnswers[qIndex] === oIndex && (
                            <div className="bg-white rounded-full animate-scale-in"
                                 style={{ 
                                   width: '0.375rem',
                                   height: '0.375rem'
                                 }}></div>
                          )}
                        </div>
                      </div>
                      <span className={`transition-all duration-300 overflow-safe min-w-0 flex-1
                                      ${selectedAnswers[qIndex] === oIndex 
                                        ? 'text-slate-50 font-medium' 
                                        : 'text-slate-200 group-hover/option:text-slate-100'}`}
                            style={{ 
                              marginLeft: 'var(--space-md)',
                              fontSize: 'var(--font-size-sm)'
                            }}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {quizError && (
          <div className="container max-w-4xl mx-auto bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm animate-scale-in overflow-safe"
               style={{ 
                 marginTop: 'var(--space-md)',
                 padding: 'var(--space-md)'
               }}>
            <div className="flex items-center">
              <svg className="text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                   style={{ 
                     width: 'var(--font-size-lg)',
                     height: 'var(--font-size-lg)',
                     marginRight: 'var(--space-sm)'
                   }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 font-medium overflow-safe"
                 style={{ fontSize: 'var(--font-size-sm)' }}>
                {quizError}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 backdrop-blur-xl bg-black/20 flex-shrink-0 safe-bottom"
           style={{ padding: 'var(--space-md)' }}>
        <div className="container max-w-4xl mx-auto">
          <button
            type="submit"
            disabled={isSubmitting || Object.keys(selectedAnswers).length !== questions.length}
            className="group relative w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-2xl hover:from-indigo-400 hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 disabled:hover:transform-none touch-optimized overflow-safe"
            style={{ 
              minHeight: 'var(--touch-target-comfortable)',
              padding: 'var(--space-lg)',
              fontSize: 'var(--font-size-base)'
            }}
            aria-label="Submit quiz answers"
          >
            {/* Button glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            
            {isSubmitting ? (
              <>
                <div className="premium-spinner flex-shrink-0"
                     style={{ marginRight: 'var(--space-sm)' }}></div>
                <span className="relative">Submitting...</span>
              </>
            ) : (
              <>
                <svg className="group-hover:scale-110 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                     style={{ 
                       width: 'var(--font-size-lg)',
                       height: 'var(--font-size-lg)',
                       marginRight: 'var(--space-sm)'
                     }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="relative">Submit Answers</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};