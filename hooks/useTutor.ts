import { useEffect, useRef, useCallback } from 'react';
import { TeachingMethod, UserIntent, LearningPhase, ChatMessage, UserAnswer } from '../types';
import { QUIZ_QUESTIONS_COUNT, QUIZ_PASS_THRESHOLD, AI_TUTOR_NAME } from '../constants';
import { GroqService } from '../services/GroqService';
import { useTutorStore } from '../store/useTutorStore';

export function useTutor() {
  const store = useTutorStore();
  const { 
    chatMessages, currentTopic, syllabus, currentSyllabusIndex, currentMethod, 
    currentExplanation, currentQuiz, learningPhase, hasRetriedCurrentMethodExplanation,
    isLoading, error
  } = store;

  const hasGreeted = useRef(chatMessages.length > 0);
  const aiService = useRef(new GroqService()).current;

  const appendChatMessage = useCallback((sender: 'ai' | 'user', text: string) => {
    const newMsg: ChatMessage = { id: Date.now().toString() + Math.random(), sender, text, timestamp: Date.now() };
    store.addMessage(newMsg);
  }, [store]);

  // initial greeting
  useEffect(() => {
    if (!hasGreeted.current && learningPhase === LearningPhase.GREETING && chatMessages.length === 0) {
      appendChatMessage('ai', `Hello! I'm your AI tutor from ${AI_TUTOR_NAME}. What would you like to learn today?`);
      store.setLearningPhase(LearningPhase.AWAITING_TOPIC);
      hasGreeted.current = true;
    }
  }, [learningPhase, appendChatMessage, chatMessages.length, store]);

  const handleApiKeyError = useCallback(() => {
    store.setError('API Key for Groq is not configured. Please ensure it is set in the environment variables.');
    appendChatMessage('ai', 'Sorry, I am unable to process requests at this time due to a configuration issue.');
    store.setLearningPhase(LearningPhase.API_ERROR);
    store.setIsLoading(false);
  }, [appendChatMessage, store]);

  const withApiKeyCheck = useCallback(<T,>(fn: (...args: any[]) => Promise<T>) => {
    return async (...args: any[]): Promise<T | undefined> => {
      store.setIsLoading(true);
      store.setError(null);
      try {
        if (!aiService.isApiKeySet()) {
          handleApiKeyError();
          return undefined;
        }
        const result = await fn(...args);
        return result;
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'Failed to fetch data from AI.';
        store.setError(errorMessage);
        appendChatMessage('ai', `Sorry, I encountered an error: ${errorMessage}. Please try again or start a new topic.`);
        store.setLearningPhase(LearningPhase.AWAITING_TOPIC);
        store.setCurrentTopic('');
        return undefined;
      } finally {
        store.setIsLoading(false);
      }
    };
  }, [aiService, handleApiKeyError, appendChatMessage, store]);

  const fetchExplanation = useCallback(async (topic: string, method: TeachingMethod, isRetry: boolean = false) => {
    if (!isRetry) store.setHasRetriedCurrentMethodExplanation(false);

    // Create the AI message immediately so we can stream into it
    const messageId = Date.now().toString() + Math.random();
    const newMsg: ChatMessage = { id: messageId, sender: 'ai', text: '', timestamp: Date.now() };
    store.addMessage(newMsg);
    store.setLearningPhase(LearningPhase.DISPLAYING_EXPLANATION);

    const finalExplanation = await aiService.getExplanation(topic, method, isRetry, chatMessages, (chunk) => {
      store.updateMessageText(messageId, chunk);
    });

    store.setCurrentExplanation(finalExplanation);
    appendChatMessage('ai', "Do you feel like you've got a good grasp of this?");
    store.setLearningPhase(LearningPhase.AWAITING_UNDERSTANDING_CONFIRMATION);
  }, [appendChatMessage, aiService, chatMessages, store]);

  const fetchQuestions = useCallback(async (topic: string, method: TeachingMethod, explanation: string) => {
    if (explanation.length < 200) {
      appendChatMessage('ai', `The explanation for "${topic}" was quite brief. It seems like it might not be a complex enough topic for a quiz. Would you like to learn about something else?`);
      store.setLearningPhase(LearningPhase.AWAITING_TOPIC);
      store.setCurrentTopic('');
      return;
    }

    const questions = await aiService.generateQuestions(topic, method, explanation, QUIZ_QUESTIONS_COUNT);
    store.setCurrentQuiz(questions);
    store.setUserQuizAnswers([]);
    appendChatMessage('ai', `Okay, let's test your understanding with ${QUIZ_QUESTIONS_COUNT} questions.`);
    store.setLearningPhase(LearningPhase.DISPLAYING_QUIZ);
  }, [appendChatMessage, aiService, store]);

  const handleUserMessage = useCallback(async (message: string) => {
    appendChatMessage('user', message);

    if (learningPhase === LearningPhase.AWAITING_TOPIC) {
      // Pass chat history so the classifier understands context (e.g. follow-up messages)
      const intent = await withApiKeyCheck(aiService.classifyUserIntent.bind(aiService))(message, chatMessages);

      if (intent === UserIntent.LEARNING_TOPIC) {
        // Extract the clean topic name from message + conversation context
        const cleanTopic = await aiService.extractTopic(message, chatMessages);
        store.setCurrentTopic(cleanTopic);
        store.setLearningPhase(LearningPhase.AWAITING_SYLLABUS_PREFERENCE);
        appendChatMessage('ai', `Would you like me to generate a structured step-by-step learning roadmap for **${cleanTopic}**, or should we just dive straight into explaining it?`);
      } else if (intent !== undefined) {
        const response = await withApiKeyCheck(aiService.getGeneralResponse.bind(aiService))(message, chatMessages);
        if (response !== undefined) {
          appendChatMessage('ai', response);
        }
      }
    }
  }, [appendChatMessage, learningPhase, withApiKeyCheck, aiService, chatMessages, store]);

  const handleSyllabusPreference = useCallback(async (wantsSyllabus: boolean) => {
    if (learningPhase !== LearningPhase.AWAITING_SYLLABUS_PREFERENCE) return;

    if (wantsSyllabus) {
      appendChatMessage('user', "Yes, please generate a structured syllabus.");
      store.setLearningPhase(LearningPhase.GENERATING_SYLLABUS);
      store.setIsLoading(true);
      try {
        if (!aiService.isApiKeySet()) {
            handleApiKeyError();
            return;
        }
        const steps = await aiService.generateSyllabus(currentTopic);
        store.setSyllabus(steps);
        store.setCurrentSyllabusIndex(0);
        store.setCurrentMethod(TeachingMethod.STANDARD);
        store.setCurrentQuiz(null);
        store.setUserQuizAnswers([]);
        store.setHasRetriedCurrentMethodExplanation(false);
        
        appendChatMessage('ai', `I've created a learning roadmap for **${currentTopic}**! Let's dive right into step 1: **${steps[0]}**.`);
        
        const messageId = Date.now().toString() + Math.random();
        const newMsg: ChatMessage = { id: messageId, sender: 'ai', text: '', timestamp: Date.now() };
        store.addMessage(newMsg);
        store.setLearningPhase(LearningPhase.DISPLAYING_EXPLANATION);

        const explanation = await aiService.getExplanation(
            `Explain ${steps[0]} within the context of ${currentTopic}`, 
            TeachingMethod.STANDARD, 
            false, 
            chatMessages,
            (chunk) => store.updateMessageText(messageId, chunk)
        );
        store.setCurrentExplanation(explanation);
        
        appendChatMessage('ai', "Do you feel like you've got a good grasp of this?");
        store.setLearningPhase(LearningPhase.AWAITING_UNDERSTANDING_CONFIRMATION);
      } catch (e) {
        console.error(e);
        store.setError(null);
        appendChatMessage('ai', `Sorry, I couldn't organize a syllabus right now. Let's just study the topic directly!`);
        await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.STANDARD, false);
      } finally {
        store.setIsLoading(false);
      }
    } else {
      appendChatMessage('user', "No, let's just dive straight into it.");
      store.setCurrentMethod(TeachingMethod.STANDARD);
      store.setCurrentQuiz(null);
      store.setUserQuizAnswers([]);
      store.setSyllabus(null);
      store.setHasRetriedCurrentMethodExplanation(false);
      await withApiKeyCheck(fetchExplanation)(currentTopic, TeachingMethod.STANDARD, false);
    }
  }, [learningPhase, currentTopic, appendChatMessage, aiService, chatMessages, fetchExplanation, withApiKeyCheck, handleApiKeyError, store]);

  const handleUnderstandingResponse = useCallback(async (understood: boolean) => {
    if (learningPhase !== LearningPhase.AWAITING_UNDERSTANDING_CONFIRMATION) return;

    appendChatMessage('user', understood ? "Yes, I understand." : "No, I'm still a bit confused.");
    
    const activeSubtopic = syllabus ? syllabus[currentSyllabusIndex] : currentTopic;

    if (understood) {
      await withApiKeyCheck(fetchQuestions)(activeSubtopic, currentMethod, currentExplanation);
    } else {
      if (currentMethod === TeachingMethod.STANDARD) {
        if (!hasRetriedCurrentMethodExplanation) {
          store.setHasRetriedCurrentMethodExplanation(true);
          appendChatMessage('ai', "Okay, let me try to explain that again in a different way.");
          await withApiKeyCheck(fetchExplanation)(syllabus ? `Explain ${activeSubtopic} in context of ${currentTopic}` : currentTopic, TeachingMethod.STANDARD, true);
        } else {
          appendChatMessage('ai', "It seems like we need to try a different approach. Let's try explaining this in a simpler way with some examples.");
          store.setCurrentMethod(TeachingMethod.SIMPLIFIED);
          await withApiKeyCheck(fetchExplanation)(syllabus ? `Explain ${activeSubtopic} in context of ${currentTopic}` : currentTopic, TeachingMethod.SIMPLIFIED, false);
        }
      } else if (currentMethod === TeachingMethod.SIMPLIFIED) {
        appendChatMessage('ai', "No worries at all! Sometimes the easiest way to understand something is to see how it works in real life. Let's learn about this as if we were explaining it to a child.");
        store.setCurrentMethod(TeachingMethod.CHILD_FRIENDLY);
        await withApiKeyCheck(fetchExplanation)(syllabus ? `Explain ${activeSubtopic} in context of ${currentTopic}` : currentTopic, TeachingMethod.CHILD_FRIENDLY, false);
      } else if (currentMethod === TeachingMethod.CHILD_FRIENDLY) {
        appendChatMessage('ai', "It's completely normal to need a few tries! We'll keep going. Let me explain that again using the simplest possible real-world examples.");
        await withApiKeyCheck(fetchExplanation)(syllabus ? `Explain ${activeSubtopic} in context of ${currentTopic}` : currentTopic, TeachingMethod.CHILD_FRIENDLY, true);
      }
    }
  }, [learningPhase, appendChatMessage, fetchQuestions, currentTopic, currentMethod, currentExplanation, hasRetriedCurrentMethodExplanation, fetchExplanation, withApiKeyCheck, syllabus, currentSyllabusIndex, store]);

  const handleTeachingMethodRetry = useCallback(async () => {
    const activeSubtopic = syllabus ? syllabus[currentSyllabusIndex] : currentTopic;
    const fetchPath = syllabus ? `Explain ${activeSubtopic} in context of ${currentTopic}` : currentTopic;

    if (currentMethod === TeachingMethod.STANDARD) {
      appendChatMessage('ai', "Let's try explaining this in a simpler way with some examples.");
      store.setCurrentMethod(TeachingMethod.SIMPLIFIED);
      await withApiKeyCheck(fetchExplanation)(fetchPath, TeachingMethod.SIMPLIFIED, false);
    } else if (currentMethod === TeachingMethod.SIMPLIFIED) {
      appendChatMessage('ai', "No worries at all! Sometimes the easiest way to understand something is to see how it works in real life. Let's learn about this as if we were explaining it to a child.");
      store.setCurrentMethod(TeachingMethod.CHILD_FRIENDLY);
      await withApiKeyCheck(fetchExplanation)(fetchPath, TeachingMethod.CHILD_FRIENDLY, false);
    } else {
      appendChatMessage('ai', "It's completely normal to need a few tries! We'll keep going until you've got it. Let's review this again using the simplest possible real-world examples.");
      await withApiKeyCheck(fetchExplanation)(fetchPath, TeachingMethod.CHILD_FRIENDLY, false);
    }
  }, [currentMethod, appendChatMessage, currentTopic, fetchExplanation, withApiKeyCheck, syllabus, currentSyllabusIndex, store]);

  const handleQuizSubmit = useCallback(async (answers: UserAnswer[]) => {
    if (!currentQuiz) return;
    store.setUserQuizAnswers(answers);
    store.setLearningPhase(LearningPhase.EVALUATING_QUIZ);

    let correctAnswers = 0;
    answers.forEach(answer => {
      if (currentQuiz[answer.questionIndex].correctOptionIndex === answer.selectedOptionIndex) {
        correctAnswers++;
      }
    });
    const score = correctAnswers / currentQuiz.length;
    const activeTopic = syllabus ? syllabus[currentSyllabusIndex] : currentTopic;

    let quizSummary = `## Quiz Results for "${activeTopic}"\n\n`;
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

    if (score >= QUIZ_PASS_THRESHOLD) {
      if (syllabus && currentSyllabusIndex < syllabus.length - 1) {
         const nextIndex = currentSyllabusIndex + 1;
         store.setCurrentSyllabusIndex(nextIndex);
         appendChatMessage('ai', quizSummary + `Great job! You've successfully conquered **${activeTopic}**. Moving right along to step ${nextIndex + 1}: **${syllabus[nextIndex]}**!`);
         store.setCurrentQuiz(null);
         
         const fetchPath = `Explain ${syllabus[nextIndex]} within the context of ${currentTopic}`;
         store.setCurrentMethod(TeachingMethod.STANDARD);
         store.setHasRetriedCurrentMethodExplanation(false);
         await withApiKeyCheck(fetchExplanation)(fetchPath, TeachingMethod.STANDARD, false);

      } else {
         appendChatMessage('ai', quizSummary + `🏆 **Congratulations!** You've completed the entire learning roadmap for **${currentTopic}**! 🎉\n\nIs there anything else you'd like to master today?`);
         store.setLearningPhase(LearningPhase.AWAITING_TOPIC);
         store.setCurrentTopic('');
         store.setCurrentQuiz(null);
         store.setSyllabus(null);
         store.setCurrentSyllabusIndex(0);
      }
    } else {
      appendChatMessage('ai', quizSummary + `That's okay, let's try another approach.`);
      store.setCurrentQuiz(null);
      handleTeachingMethodRetry();
    }
  }, [currentQuiz, currentMethod, currentTopic, appendChatMessage, handleTeachingMethodRetry, syllabus, currentSyllabusIndex, fetchExplanation, withApiKeyCheck, store]);

  const handleStartNewTopic = useCallback(() => {
    if (confirm("Are you sure you want to start a new topic? This will clear the current conversation.")) {
        store.resetAll();
        hasGreeted.current = false;
        // Optionally if we want to immediately reset greeting:
        // store.setLearningPhase(LearningPhase.GREETING);
    }
  }, [store]);

  const handleExplanationRetry = useCallback(async () => {
    const activeSubtopic = syllabus ? syllabus[currentSyllabusIndex] : currentTopic;
    const fetchPath = syllabus ? `Explain ${activeSubtopic} in context of ${currentTopic}` : currentTopic;

    if (currentMethod === TeachingMethod.STANDARD) {
      if (!hasRetriedCurrentMethodExplanation) {
        store.setHasRetriedCurrentMethodExplanation(true);
        appendChatMessage('ai', "Okay, let me try to explain that again in a different way.");
        await withApiKeyCheck(fetchExplanation)(fetchPath, TeachingMethod.STANDARD, true);
      } else {
        appendChatMessage('ai', "It seems like we need to try a different approach. Let's try explaining this in a simpler way with some examples.");
        store.setCurrentMethod(TeachingMethod.SIMPLIFIED);
        await withApiKeyCheck(fetchExplanation)(fetchPath, TeachingMethod.SIMPLIFIED, false);
      }
    } else if (currentMethod === TeachingMethod.SIMPLIFIED) {
      appendChatMessage('ai', "No worries at all! Sometimes the easiest way to understand something is to see how it works in real life. Let's learn about this as if we were explaining it to a child.");
      store.setCurrentMethod(TeachingMethod.CHILD_FRIENDLY);
      await withApiKeyCheck(fetchExplanation)(fetchPath, TeachingMethod.CHILD_FRIENDLY, false);
    } else if (currentMethod === TeachingMethod.CHILD_FRIENDLY) {
      appendChatMessage('ai', "It's completely normal to need a few tries! We'll keep going. Let me explain that again using the simplest possible real-world examples.");
      await withApiKeyCheck(fetchExplanation)(fetchPath, TeachingMethod.CHILD_FRIENDLY, true);
    }
  }, [currentMethod, hasRetriedCurrentMethodExplanation, appendChatMessage, currentTopic, fetchExplanation, withApiKeyCheck, syllabus, currentSyllabusIndex, store]);

  return {
    state: {
      chatMessages,
      currentTopic,
      currentQuiz,
      syllabus,
      currentSyllabusIndex,
      learningPhase,
      isLoading,
      error
    },
    actions: {
      handleUserMessage,
      handleUnderstandingResponse,
      handleQuizSubmit,
      handleStartNewTopic,
      handleExplanationRetry,
      handleSyllabusPreference
    }
  };
}
