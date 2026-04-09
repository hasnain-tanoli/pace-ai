import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, TeachingMethod, QuizQuestion, UserAnswer, LearningPhase } from '../types';

interface TutorState {
  chatMessages: ChatMessage[];
  currentTopic: string;
  syllabus: string[] | null;
  currentSyllabusIndex: number;
  currentMethod: TeachingMethod;
  currentExplanation: string;
  currentQuiz: QuizQuestion[] | null;
  userQuizAnswers: UserAnswer[];
  learningPhase: LearningPhase;
  hasRetriedCurrentMethodExplanation: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setChatMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessageText: (id: string, textChunk: string) => void;
  setCurrentTopic: (topic: string) => void;
  setSyllabus: (syllabus: string[] | null) => void;
  setCurrentSyllabusIndex: (index: number) => void;
  setCurrentMethod: (method: TeachingMethod) => void;
  setCurrentExplanation: (explanation: string) => void;
  setCurrentQuiz: (quiz: QuizQuestion[] | null) => void;
  setUserQuizAnswers: (answers: UserAnswer[]) => void;
  setLearningPhase: (phase: LearningPhase) => void;
  setHasRetriedCurrentMethodExplanation: (retried: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  resetAll: () => void;
}

const initialState = {
  chatMessages: [],
  currentTopic: '',
  syllabus: null,
  currentSyllabusIndex: 0,
  currentMethod: TeachingMethod.STANDARD,
  currentExplanation: '',
  currentQuiz: null,
  userQuizAnswers: [],
  learningPhase: LearningPhase.GREETING,
  hasRetriedCurrentMethodExplanation: false,
};

export const useTutorStore = create<TutorState>()(
  persist(
    (set) => ({
      ...initialState,
      isLoading: false,
      error: null,
      
      setChatMessages: (chatMessages) => set({ chatMessages }),
      addMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      updateMessageText: (id, textChunk) => set((state) => ({
        chatMessages: state.chatMessages.map(msg => 
          msg.id === id ? { ...msg, text: msg.text + textChunk } : msg
        )
      })),
      setCurrentTopic: (currentTopic) => set({ currentTopic }),
      setSyllabus: (syllabus) => set({ syllabus }),
      setCurrentSyllabusIndex: (currentSyllabusIndex) => set({ currentSyllabusIndex }),
      setCurrentMethod: (currentMethod) => set({ currentMethod }),
      setCurrentExplanation: (currentExplanation) => set({ currentExplanation }),
      setCurrentQuiz: (currentQuiz) => set({ currentQuiz }),
      setUserQuizAnswers: (userQuizAnswers) => set({ userQuizAnswers }),
      setLearningPhase: (learningPhase) => set({ learningPhase }),
      setHasRetriedCurrentMethodExplanation: (hasRetriedCurrentMethodExplanation) => set({ hasRetriedCurrentMethodExplanation }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      resetAll: () => set(initialState),
    }),
    {
      name: 'pace_ai_session_v2', // unique name
      // Only persist core session data, not transient loading/error states
      partialize: (state) => ({
        chatMessages: state.chatMessages,
        currentTopic: state.currentTopic,
        syllabus: state.syllabus,
        currentSyllabusIndex: state.currentSyllabusIndex,
        currentMethod: state.currentMethod,
        currentExplanation: state.currentExplanation,
        currentQuiz: state.currentQuiz,
        userQuizAnswers: state.userQuizAnswers,
        learningPhase: state.learningPhase,
        hasRetriedCurrentMethodExplanation: state.hasRetriedCurrentMethodExplanation,
      }),
    }
  )
);
