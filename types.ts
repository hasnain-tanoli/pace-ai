
export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
}

export enum TeachingMethod {
  STANDARD = 1,
  SIMPLIFIED = 2,
  CHILD_FRIENDLY = 3,
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number; // 0-indexed
}

export interface UserAnswer {
  questionIndex: number;
  selectedOptionIndex: number;
}

export enum UserIntent {
  GREETING = 'GREETING',
  GENERAL_CHAT = 'GENERAL_CHAT',
  LEARNING_TOPIC = 'LEARNING_TOPIC',
}

export enum LearningPhase {
  GREETING,
  AWAITING_TOPIC,
  FETCHING_EXPLANATION,
  DISPLAYING_EXPLANATION,
  AWAITING_UNDERSTANDING_CONFIRMATION,
  FETCHING_QUESTIONS,
  DISPLAYING_QUIZ,
  EVALUATING_QUIZ,
  TOPIC_PASSED,
  TOPIC_FAILED_PROCEED_TO_NEXT_METHOD, // General phase for moving to M2 or M3
  RETRYING_METHOD_3, // Specifically for re-teaching Method 3
  API_ERROR,
}
