
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TeachingMethod, QuizQuestion, UserIntent } from '../types';
import { GEMINI_MODEL_TEXT } from '../constants';

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private apiKey: string | undefined = process.env.API_KEY;

  constructor() {
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    } else {
      console.error("API_KEY is not defined in environment variables. GeminiService will not function.");
    }
  }

  public isApiKeySet(): boolean {
    return !!this.apiKey && !!this.ai;
  }

  private getMethodDescription(method: TeachingMethod): string {
    switch (method) {
      case TeachingMethod.STANDARD:
        return "a standard, formal explanation like a textbook, covering core concepts, definitions, and technical details.";
      case TeachingMethod.SIMPLIFIED:
        return "simplifying complex ideas using analogies, straightforward examples, and illustrative scenarios, avoiding jargon, for someone who struggled with a standard explanation.";
      case TeachingMethod.CHILD_FRIENDLY:
        return "using extremely simple language, relatable real-world analogies, and concrete examples a young child could grasp, focusing on the core idea and its practical application, for someone who struggled with simpler explanations.";
      default:
        return "a general explanation.";
    }
  }

  async classifyUserIntent(message: string): Promise<UserIntent> {
    if (!this.ai) {
      throw new Error("Gemini AI client is not initialized. Check API Key.");
    }

    const prompt = `
    Analyze the following user message and classify its intent into one of these categories:
    - GREETING: The user is saying hello, goodbye, or a general pleasantry.
    - GENERAL_CHAT: The user is engaging in casual conversation, asking a non-learning-related question, or making a comment not directly related to a learning topic.
    - LEARNING_TOPIC: The user is asking to learn about a specific topic, asking a question related to a learning topic, or indicating a desire to start a learning session.

    Return only the category name (e.g., GREETING, GENERAL_CHAT, LEARNING_TOPIC).

    User message: "${message}"
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: "user", parts: [{text: prompt}] }],
        config: {
          temperature: 0.1, // Keep temperature low for consistent classification
        }
      });

      if (response.text === undefined) {
        throw new Error("AI response text is undefined for intent classification.");
      }

      const classification = response.text.trim().toUpperCase();
      if (Object.values(UserIntent).includes(classification as UserIntent)) {
        return classification as UserIntent;
      } else {
        console.warn(`Unknown intent classified: ${classification}. Defaulting to GENERAL_CHAT.`);
        return UserIntent.GENERAL_CHAT;
      }
    } catch (error) {
      console.error("Error classifying user intent:", error);
      // Default to general chat if classification fails
      return UserIntent.GENERAL_CHAT;
    }
  }

  async getGeneralResponse(message: string): Promise<string> {
    if (!this.ai) {
      throw new Error("Gemini AI client is not initialized. Check API Key.");
    }

    const prompt = `
    You are a helpful AI assistant. The user has sent a message that is either a greeting or general chat.
    Respond appropriately to the user's message. Do NOT act as a tutor or try to teach a topic.
    Keep your response concise and friendly.

    User message: "${message}"
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: "user", parts: [{text: prompt}] }],
        config: {
          temperature: 0.7, // Allow for more creative responses for general chat
        }
      });

      if (response.text === undefined) {
        throw new Error("AI response text is undefined for general response.");
      }
      return response.text;
    } catch (error) {
      console.error("Error fetching general response from Gemini:", error);
      throw new Error(`Failed to get a general response. The AI service might be experiencing issues.`);
    }
  }

  async getExplanation(topic: string, method: TeachingMethod, isRetryOfCurrentMethodExplanation: boolean = false): Promise<string> {
    if (!this.ai) {
      throw new Error("Gemini AI client is not initialized. Check API Key.");
    }

    let retryInstruction = "";
    if (isRetryOfCurrentMethodExplanation && (method === TeachingMethod.STANDARD || method === TeachingMethod.CHILD_FRIENDLY)) {
      retryInstruction = "The user indicated they didn't understand your previous explanation for this specific method. Please try a different angle or rephrase it. ";
    }
    
    const systemInstruction = `You are an AI Tutor. Your current goal is to teach the user about "${topic}".
${retryInstruction}Explain this using ${this.getMethodDescription(method)}
Please structure your explanation with clear headings (e.g., ## Introduction, ## Key Concepts) and use markdown formatting for readability.`;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: "user", parts: [{text: `Teach me about ${topic}.`}] }],
        config: {
          systemInstruction: systemInstruction,
        }
      });
      if (response.text === undefined) {
        throw new Error("AI response text is undefined.");
      }
      return response.text;
    } catch (error) {
      console.error("Error fetching explanation from Gemini:", error);
      throw new Error(`Failed to get explanation for ${topic}.`);
    }
  }

  private isValidQuizData(data: any): data is QuizQuestion[] {
    if (
        Array.isArray(data) && 
        data.length > 0 && 
        data.every(item =>
            item && // Ensure item is not null/undefined
            typeof item.questionText === 'string' &&
            Array.isArray(item.options) && 
            item.options.length === 4 && 
            item.options.every((opt: any) => typeof opt === 'string') &&
            typeof item.correctOptionIndex === 'number' && 
            item.correctOptionIndex >= 0 && 
            item.correctOptionIndex < item.options.length
        )
    ) {
        return true;
    }
    console.warn("Parsed data does not match QuizQuestion[] structure or is empty/invalid:", data);
    return false;
  }

  async generateQuestions(topic: string, method: TeachingMethod, explanationText: string, numQuestions: number): Promise<QuizQuestion[]> {
    if (!this.ai) {
      throw new Error("Gemini AI client is not initialized. Check API Key.");
    }
    
    const methodDescription = this.getMethodDescription(method);

    const prompt = `
You are an AI quiz generator.
Topic: "${topic}"
Teaching Method Used: "${methodDescription}"
Explanation Provided to User (on which questions should be based):
---
${explanationText}
---
Based EXCLUSIVELY on the Explanation Provided, generate ${numQuestions} multiple-choice quiz questions.

Your response MUST be a valid JSON array. Each object in the array must strictly follow this structure:
{
  "questionText": "string",
  "options": ["string", "string", "string", "string"],
  "correctOptionIndex": "number" 
}
The "questionText" is the quiz question.
"options" must be an array of exactly 4 string answer choices.
"correctOptionIndex" must be a 0-indexed integer (0, 1, 2, or 3) indicating the correct option from the "options" array.

Do NOT include any text, comments, or markdown characters (like \`\`\`json) outside the main JSON array itself. Ensure the output is pure JSON.

Example of the required JSON array format:
[
  {
    "questionText": "What is the primary color of the sky on a clear day?",
    "options": ["Green", "Blue", "Red", "Yellow"],
    "correctOptionIndex": 1
  },
  {
    "questionText": "How many legs does a spider typically have?",
    "options": ["4", "6", "8", "10"],
    "correctOptionIndex": 2
  }
]
`;
    let rawResponseText = "";
    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: "user", parts: [{text: prompt}] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      if (response.text === undefined) {
        throw new Error("AI response text is undefined for quiz generation.");
      }
      rawResponseText = response.text;

      // Attempt 1: Direct parse (assuming responseMimeType: "application/json" worked perfectly)
      try {
          const parsed = JSON.parse(rawResponseText.trim());
          if (this.isValidQuizData(parsed)) return parsed;
      } catch (e) { /* Ignore and try next step */ }

      // Attempt 2: Clean markdown fences and parse
      // Regex from @google/genai coding guidelines
      let textToParse = rawResponseText.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; 
      const match = textToParse.match(fenceRegex);
      if (match && match[2]) {
          textToParse = match[2].trim();
      }
      try {
          const parsed = JSON.parse(textToParse);
          if (this.isValidQuizData(parsed)) return parsed;
      } catch (e) { /* Ignore and try next step */ }
      
      // Attempt 3: Extract content between first '[' and last ']' (more aggressive)
      try {
          // Ensure textToParse still holds the potentially fenced or raw string if fence removal didn't apply or failed
          let currentTextForBracketExtraction = rawResponseText.trim(); 
          if (match && match[2]) { // If fence removal produced something, use that
            currentTextForBracketExtraction = match[2].trim();
          }

          const firstBracket = currentTextForBracketExtraction.indexOf('[');
          const lastBracket = currentTextForBracketExtraction.lastIndexOf(']');
          if (firstBracket !== -1 && lastBracket > firstBracket) {
              const potentialJson = currentTextForBracketExtraction.substring(firstBracket, lastBracket + 1);
              const parsed = JSON.parse(potentialJson.trim());
              if (this.isValidQuizData(parsed)) return parsed;
          }
      } catch (e) { /* Ignore and try next step */ }
      
      // If all attempts fail
      console.error("Failed to parse JSON for questions after multiple attempts. Raw response:", rawResponseText);
      throw new Error("AI returned data in an unparsable or invalid format for quiz questions.");

    } catch (error) {
      console.error("Error generating questions from Gemini:", error, "Raw response text if available:", rawResponseText);
      if (error instanceof Error && error.message.startsWith("AI returned data in an unparsable")) {
        throw error; 
      }
      throw new Error(`Failed to generate quiz questions for ${topic}. The AI service might be experiencing issues.`);
    }
  }
}
