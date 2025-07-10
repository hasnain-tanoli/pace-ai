import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, TeachingMethod, QuizQuestion, UserAnswer, LearningPhase, UserIntent } from './types';
import { AI_TUTOR_NAME, QUIZ_PASS_THRESHOLD, QUIZ_QUESTIONS_COUNT } from './constants';
import { ChatBubble } from './components/ChatBubble';
import { UserInput } from './components/UserInput';
import { QuizDisplay } from './components/QuizDisplay';
import { ActionButtons } from './components/ActionButtons';
import { GeminiService } from './services/GeminiService';

const App: React.FC<{}> = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [currentMethod, setCurrentMethod] = useState<TeachingMethod>(TeachingMethod.STANDARD);
  const [currentExplanation, setCurrentExplanation] = useState<string>('');
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[] | null>(null);
  const [userQuizAnswers, setUserQuizAnswers] = useState<UserAnswer[]>([]);
  const [learningPhase, setLearningPhase] = useState<LearningPhase>(LearningPhase.GREETING);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRetriedCurrentMethodExplanation, setHasRetriedCurrentMethodExplanation] = useState<boolean>(false);
  
  // Smart header states
  const [headerVisible, setHeaderVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasGreeted = useRef(false); // Add this ref
  const geminiService = useRef(new GeminiService()).current;

  const addMessage = useCallback((sender: 'ai' | 'user', text: string) => {
    setChatMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), sender, text, timestamp: Date.now() }]);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      // Small delay to ensure the content has rendered
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!hasGreeted.current && learningPhase === LearningPhase.GREETING && chatMessages.length === 0) {
      addMessage('ai', `Hello! I'm your AI tutor from ${AI_TUTOR_NAME}. What would you like to learn today?`);
      setLearningPhase(LearningPhase.AWAITING_TOPIC);
      hasGreeted.current = true; // Set the flag to true after displaying the greeting
      setHeaderVisible(true); // Ensure header is visible at start
    }
  }, [learningPhase, addMessage, chatMessages.length]);

  // Smart header scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up or at the very top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setHeaderVisible(true);
      } 
      // Hide header when scrolling down (with minimal threshold)
      else if (currentScrollY > lastScrollY && currentScrollY > 30) {
        setHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    // More responsive scroll handling with reduced throttling
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [lastScrollY]);
  
  const handleApiKeyError = useCallback(() => {
    setError('API Key for Gemini is not configured. Please ensure it is set in the environment variables.');
    addMessage('ai', 'Sorry, I am unable to process requests at this time due to a configuration issue.');
    setLearningPhase(LearningPhase.API_ERROR);
    setIsLoading(false);
  }, [addMessage]);

  const withApiKeyCheck = useCallback(<T,>(fn: (...args: any[]) => Promise<T>) => {
    return async (...args: any[]): Promise<T | undefined> => {
      setIsLoading(true);
      setError(null);
      try {
        if (!geminiService.isApiKeySet()) {
          handleApiKeyError();
          return undefined;
        }
        const result = await fn(...args);
        return result;
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to fetch data from AI.';
        setError(errorMessage);
        addMessage('ai', `Sorry, I encountered an error: ${errorMessage}. Please try again or start a new topic.`);
        setLearningPhase(LearningPhase.AWAITING_TOPIC);
        setCurrentTopic('');
        return undefined;
      } finally {
        setIsLoading(false);
      }
    };
  }, [geminiService, handleApiKeyError, addMessage]);

  const fetchExplanation = useCallback(async (topic: string, method: TeachingMethod, isRetryOfCurrentMethodExplanation: boolean = false) => {
    if (!isRetryOfCurrentMethodExplanation) {
      setHasRetriedCurrentMethodExplanation(false);
    }

    const explanation = await geminiService.getExplanation(topic, method, isRetryOfCurrentMethodExplanation);
    setCurrentExplanation(explanation);
    addMessage('ai', explanation);
    setLearningPhase(LearningPhase.DISPLAYING_EXPLANATION);

    addMessage('ai', "Do you feel like you've got a good grasp of this?");
    setLearningPhase(LearningPhase.AWAITING_UNDERSTANDING_CONFIRMATION);

  }, [addMessage, geminiService]);

  const fetchQuestions = useCallback(async (topic: string, method: TeachingMethod, explanation: string) => {
    // If the explanation is too short, it's likely not a substantial topic for a quiz.
    // This helps prevent errors when the AI struggles to generate questions for trivial topics.
    if (explanation.length < 200) { // A threshold of 200 characters for a meaningful explanation
      addMessage('ai', `The explanation for "${topic}" was quite brief. It seems like it might not be a complex enough topic for a quiz. Would you like to learn about something else?`);
      setLearningPhase(LearningPhase.AWAITING_TOPIC);
      setCurrentTopic('');
      return;
    }

    const questions = await geminiService.generateQuestions(topic, method, explanation, QUIZ_QUESTIONS_COUNT);
    setCurrentQuiz(questions);
    setUserQuizAnswers([]);
    addMessage('ai', `Okay, let's test your understanding with ${QUIZ_QUESTIONS_COUNT} questions.`);
    setLearningPhase(LearningPhase.DISPLAYING_QUIZ);
  }, [addMessage, geminiService]);


  const handleUserMessage = useCallback(async (message: string) => {
    addMessage('user', message);

    if (learningPhase === LearningPhase.AWAITING_TOPIC) {
      const intent = await withApiKeyCheck(geminiService.classifyUserIntent.bind(geminiService))(message);

      if (intent === UserIntent.LEARNING_TOPIC) {
        setCurrentTopic(message);
        setCurrentMethod(TeachingMethod.STANDARD);
        setCurrentQuiz(null);
        setUserQuizAnswers([]);
        setHasRetriedCurrentMethodExplanation(false);
        await withApiKeyCheck(fetchExplanation)(message, TeachingMethod.STANDARD, false);
      } else if (intent !== undefined) { // Ensure intent is not undefined before proceeding
        // Handle greetings or general chat
        const response = await withApiKeyCheck(geminiService.getGeneralResponse.bind(geminiService))(message);
        if (response !== undefined) { // Ensure response is not undefined before adding message
          addMessage('ai', response);
        }
        // Stay in AWAITING_TOPIC phase to allow user to ask for a topic again
      }
    } else {
      // If not in AWAITING_TOPIC, just add the message and let the current phase logic handle it.
      // This might be a response to a quiz or understanding confirmation.
      // For now, we assume messages outside AWAITING_TOPIC are context-specific.
      // Future improvement: classify intent in other phases too if needed.
    }
  }, [addMessage, learningPhase, fetchExplanation, withApiKeyCheck, geminiService]);

  const handleUnderstandingResponse = useCallback(async (understood: boolean) => {
    if (learningPhase !== LearningPhase.AWAITING_UNDERSTANDING_CONFIRMATION) return;

    addMessage('user', understood ? "Yes, I understand." : "No, I'm still a bit confused.");

    if (understood) {
      await withApiKeyCheck(fetchQuestions)(currentTopic, currentMethod, currentExplanation);
    } else {
      if (currentMethod === TeachingMethod.STANDARD) {
        if (!hasRetriedCurrentMethodExplanation) {
          setHasRetriedCurrentMethodExplanation(true);
          addMessage('ai', "Okay, let me try to explain that again in a different way.");
          await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.STANDARD, true);
        } else {
          addMessage('ai', "It seems like we need to try a different approach. Let's try explaining this in a simpler way with some examples.");
          setCurrentMethod(TeachingMethod.SIMPLIFIED);
          await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.SIMPLIFIED, false);
        }
      } else if (currentMethod === TeachingMethod.SIMPLIFIED) {
        addMessage('ai', "No worries at all! Sometimes the easiest way to understand something is to see how it works in real life. Let's learn about this as if we were explaining it to a child.");
        setCurrentMethod(TeachingMethod.CHILD_FRIENDLY);
        await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.CHILD_FRIENDLY, false);
      } else if (currentMethod === TeachingMethod.CHILD_FRIENDLY) {
        addMessage('ai', "It's completely normal to need a few tries! We'll keep going. Let me explain that again using the simplest possible real-world examples.");
        await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.CHILD_FRIENDLY, true);
      }
    }
  }, [learningPhase, addMessage, fetchQuestions, currentTopic, currentMethod, currentExplanation, hasRetriedCurrentMethodExplanation, fetchExplanation, withApiKeyCheck]);

  const handleTeachingMethodRetry = useCallback(async () => {
    if (currentMethod === TeachingMethod.STANDARD) {
      addMessage('ai', "Let's try explaining this in a simpler way with some examples.");
      setCurrentMethod(TeachingMethod.SIMPLIFIED);
      await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.SIMPLIFIED, false);
    } else if (currentMethod === TeachingMethod.SIMPLIFIED) {
      addMessage('ai', "No worries at all! Sometimes the easiest way to understand something is to see how it works in real life. Let's learn about this as if we were explaining it to a child.");
      setCurrentMethod(TeachingMethod.CHILD_FRIENDLY);
      await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.CHILD_FRIENDLY, false);
    } else {
      addMessage('ai', "It's completely normal to need a few tries! We'll keep going until you've got it. Let's review this again using the simplest possible real-world examples.");
      await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.CHILD_FRIENDLY, false);
    }
  }, [currentMethod, addMessage, currentTopic, fetchExplanation, withApiKeyCheck]);

  const handleQuizSubmit = useCallback((answers: UserAnswer[]) => {
    if (!currentQuiz) return;
    setUserQuizAnswers(answers);
    setLearningPhase(LearningPhase.EVALUATING_QUIZ); // Will quickly transition

    let correctAnswers = 0;
    answers.forEach(answer => {
      if (currentQuiz[answer.questionIndex].correctOptionIndex === answer.selectedOptionIndex) {
        correctAnswers++;
      }
    });
    const score = correctAnswers / currentQuiz.length;

    let quizSummary = `## Quiz Results for "${currentTopic}"\n\n`;
    currentQuiz.forEach((question, index) => {
      const userAnswer = answers.find(ans => ans.questionIndex === index);
      const isCorrect = userAnswer && question.correctOptionIndex === userAnswer.selectedOptionIndex;
      const userAnswerText = userAnswer ? question.options[userAnswer.selectedOptionIndex] : 'No answer';
      const correctAnswerText = question.options[question.correctOptionIndex];

      quizSummary += `### Question ${index + 1}: ${question.questionText}\n`;
      quizSummary += `- Your Answer: ${userAnswerText} ${isCorrect ? '✅' : '❌'}\n`;
      quizSummary += `- Correct Answer: ${correctAnswerText}\n\n`;
    });

    quizSummary += `You got ${correctAnswers}/${currentQuiz.length} correct (${Math.round(score * 100)}%).\n\n`;

    // Add message about score, then transition phase
    if (score >= QUIZ_PASS_THRESHOLD) {
      addMessage('ai', quizSummary + `Great job! You've successfully learned about ${currentTopic}. Is there anything else you'd like to learn?`);
      setLearningPhase(LearningPhase.AWAITING_TOPIC);
      setCurrentTopic('');
      setCurrentQuiz(null); // This will hide the quiz
    } else {
      addMessage('ai', quizSummary + `That's okay, let's try another approach.`);
      setCurrentQuiz(null); // Hide quiz before fetching next explanation
      handleTeachingMethodRetry();
    }
  }, [currentQuiz, currentMethod, currentTopic, addMessage, handleTeachingMethodRetry]);

  const handleStartNewTopic = useCallback(() => {
    setChatMessages([]); 
    setCurrentTopic('');
    setCurrentMethod(TeachingMethod.STANDARD);
    setCurrentExplanation('');
    setCurrentQuiz(null);
    setUserQuizAnswers([]);
    setError(null);
    setHasRetriedCurrentMethodExplanation(false);
    setIsLoading(false);
    setLearningPhase(LearningPhase.GREETING);
    hasGreeted.current = false;
  }, []);

  const handleExplanationRetry = useCallback(async () => {
    if (currentMethod === TeachingMethod.STANDARD) {
      if (!hasRetriedCurrentMethodExplanation) {
        setHasRetriedCurrentMethodExplanation(true);
        addMessage('ai', "Okay, let me try to explain that again in a different way.");
        await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.STANDARD, true);
      } else {
        addMessage('ai', "It seems like we need to try a different approach. Let's try explaining this in a simpler way with some examples.");
        setCurrentMethod(TeachingMethod.SIMPLIFIED);
        await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.SIMPLIFIED, false);
      }
    } else if (currentMethod === TeachingMethod.SIMPLIFIED) {
      addMessage('ai', "No worries at all! Sometimes the easiest way to understand something is to see how it works in real life. Let's learn about this as if we were explaining it to a child.");
      setCurrentMethod(TeachingMethod.CHILD_FRIENDLY);
      await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.CHILD_FRIENDLY, false);
    } else if (currentMethod === TeachingMethod.CHILD_FRIENDLY) {
      addMessage('ai', "It's completely normal to need a few tries! We'll keep going. Let me explain that again using the simplest possible real-world examples.");
        await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.CHILD_FRIENDLY, true);
    }
  }, [currentMethod, hasRetriedCurrentMethodExplanation, addMessage, currentTopic, fetchExplanation, withApiKeyCheck]);

  if (learningPhase === LearningPhase.DISPLAYING_QUIZ && currentQuiz) {
    return (
      <QuizDisplay
        questions={currentQuiz}
        onSubmit={handleQuizSubmit}
        isSubmitting={isLoading}
      />
    );
  }

  return (
    <div className="flex flex-col mobile-vh-fix w-full overflow-hidden border-0 md:border-l md:border-r border-white/10 safe-x ios-vh-fix" 
         style={{
           background: 'linear-gradient(135deg, #0a0a0f 0%, #111116 50%, #1a1a24 100%)',
           boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05)'
         }}>
      <header className={`fixed top-0 left-0 right-0 z-fixed transition-transform duration-200 ease-out ${
        headerVisible ? 'translate-y-0' : '-translate-y-full'
      } backdrop-blur-xl border-b border-white/10 overflow-hidden bg-black/60 safe-top mobile-header-safe-padding`}
              style={{ height: 'var(--header-height)' }}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 animate-pulse"></div>
        
        <div className="relative flex justify-between items-center h-full container max-w-4xl mx-auto mobile-header-container">
          <div className="flex flex-col justify-center items-start min-w-0 flex-1 mobile-header-text-container">
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl mobile-header-title font-bold tracking-tight text-gradient leading-tight">
              {AI_TUTOR_NAME}
            </h1>
            <p className="text-xs sm:text-xs md:text-sm mobile-header-subtitle text-slate-400 font-medium tracking-wide leading-tight mt-1">
              Learn Your Way, Every Step.
            </p>
          </div>
          <div className="flex-shrink-0 mobile-header-button-container">
            <button
              onClick={handleStartNewTopic}
              className="group relative px-3 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2.5 lg:px-5 lg:py-3 mobile-header-button bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-slate-100 text-xs sm:text-sm md:text-sm lg:text-base font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-1 focus:ring-offset-transparent transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 touch-optimized"
              style={{ minHeight: 'var(--touch-target-min)', minWidth: 'var(--touch-target-min)' }}
              aria-label="Start a new topic"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 mr-1.5 sm:mr-2 group-hover:rotate-180 transition-transform duration-300 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden xs:hidden sm:inline">New Topic</span>
              <span className="xs:inline sm:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      <div className={`flex-grow overflow-y-auto mobile-scroll transition-all duration-200 ease-out relative overflow-safe ${
        headerVisible ? 'pt-16 sm:pt-18 md:pt-20 lg:pt-22' : 'pt-2 sm:pt-3 md:pt-4'
      }`}
           style={{
             paddingTop: headerVisible ? 'var(--header-height)' : 'var(--space-md)',
             paddingBottom: 'calc(var(--space-xl) + var(--touch-target-comfortable))',
             background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.8) 0%, rgba(17, 17, 22, 0.9) 100%)',
             backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)'
           }}>
        <div className="container max-w-4xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        {chatMessages.map((msg, index) => (
          <div key={msg.id} 
               className="animate-fade-in-up"
               style={{
                 animationDelay: `${index * 0.1}s`,
                 animationFillMode: 'both'
               }}>
            <ChatBubble message={msg} />
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center items-center p-4 sm:p-6 animate-scale-in" role="status" aria-live="polite">
            <div className="premium-spinner"></div>
            <div className="ml-4 flex flex-col items-start">
              <p className="text-slate-300 font-medium text-sm sm:text-base">AI is thinking...</p>
              <div className="w-24 sm:w-32 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        {error && !isLoading && (
          <div className="container p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm animate-scale-in overflow-safe" role="alert">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-xs sm:text-sm font-medium overflow-safe">{error}</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} className="h-4" />
        </div>
      </div>
      
      <div className="border-t border-white/10 backdrop-blur-xl bg-black/40 sticky bottom-0 z-sticky safe-bottom">
        {(learningPhase === LearningPhase.AWAITING_TOPIC || learningPhase === LearningPhase.AWAITING_UNDERSTANDING_CONFIRMATION) && 
         !isLoading && (
           <div className="py-2 sm:py-3 md:py-4">
            <div className="container max-w-4xl mx-auto">
            {learningPhase === LearningPhase.AWAITING_TOPIC && (
              <UserInput onSendMessage={handleUserMessage} disabled={isLoading} placeholder="What new wonders shall we explore today?" />
            )}
            {learningPhase === LearningPhase.AWAITING_UNDERSTANDING_CONFIRMATION && (
              <ActionButtons
                onYes={() => handleUnderstandingResponse(true)}
                onNo={handleExplanationRetry}
                disabled={isLoading}
              />
            )}
            </div>
          </div>
        )}
        {learningPhase === LearningPhase.API_ERROR && (
          <div className="py-2 sm:py-3 md:py-4">
            <div className="container max-w-4xl mx-auto">
              <div className="text-center text-red-300 font-semibold bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm text-sm sm:text-base p-3 sm:p-4 overflow-safe" role="alert">
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  API Key is not configured or there's a problem with the AI service. Please check the setup.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
