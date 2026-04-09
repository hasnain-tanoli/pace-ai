import { ChatMessage, TeachingMethod, QuizQuestion, UserIntent } from '../types';

const API_BASE = "http://localhost:3001/api";

export class GroqService {
  isApiKeySet(): boolean {
    return true; // Key check is now handled securely on the backend
  }

  private getMethodDescription(method: TeachingMethod): string {
    switch (method) {
      case TeachingMethod.STANDARD: return "a standard, clear, and comprehensive analytical tone.";
      case TeachingMethod.SIMPLIFIED: return "extremely simple language, avoiding all jargon, using everyday analogies.";
      case TeachingMethod.CHILD_FRIENDLY: return "a fun, incredibly simple tone suitable for a 10-year-old, using imaginative and playful examples.";
      default: return "a standard tone.";
    }
  }

  async classifyUserIntent(message: string, chatHistory: ChatMessage[] = []): Promise<UserIntent> {
    const recentContext = chatHistory.slice(-4).map(m =>
      `${m.sender === 'ai' ? 'Tutor' : 'User'}: ${m.text.slice(0, 120)}`
    ).join('\n');

    const prompt = `You are classifying a user message in an AI tutoring app.

Classify the message into ONE of these intents:
- GREETING: Pure greeting with no learning intent ("hi", "hello", "how are you")
- GENERAL_CHAT: Casual conversation that does NOT relate to learning a subject
- LEARNING_TOPIC: The user wants to learn, study, understand, or get a syllabus/roadmap for ANY subject, technology, concept, or idea. This includes:
  * Single subject names like "python", "algebra", "photosynthesis", "react", "history"
  * Requests like "teach me X", "explain X", "how does X work"
  * Requests with roadmap/syllabus intent like "create a roadmap", "make a syllabus", "explain in detail"
  * Follow-up messages that reference a previous topic in the conversation

Recent conversation context:
${recentContext || '(none)'}

User message: "${message}"

IMPORTANT: When in doubt, choose LEARNING_TOPIC. Single words that are subjects, technologies, or concepts should ALWAYS be LEARNING_TOPIC.

Return ONLY valid JSON: { "intent": "GREETING" | "GENERAL_CHAT" | "LEARNING_TOPIC" }`;

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are an intent classification engine. Output JSON only. When in doubt, return LEARNING_TOPIC." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error("Backend proxy error");
      const data = await response.json();
      const parsed = JSON.parse(data.content);
      return parsed.intent as UserIntent;
    } catch (e) {
      console.error(e);
      return UserIntent.LEARNING_TOPIC;
    }
  }

  async extractTopic(message: string, chatHistory: ChatMessage[] = []): Promise<string> {
    const recentContext = chatHistory.slice(-6).map(m =>
      `${m.sender === 'ai' ? 'Tutor' : 'User'}: ${m.text.slice(0, 150)}`
    ).join('\n');

    const prompt = `Given the conversation context and the user's latest message, extract the SPECIFIC learning topic they want to study.

Rules:
- If the message is a subject name (e.g. "python", "algebra"), return it properly capitalized (e.g. "Python", "Algebra")
- If the message is a request like "teach me React hooks", return "React Hooks"
- If the message is vague like "create a roadmap for me" or "explain it", look at the conversation context to find the topic
- Return a SHORT, clean topic name (2-5 words max). Not a sentence.

Conversation context:
${recentContext || '(none)'}

User message: "${message}"

Return ONLY valid JSON: { "topic": "<the extracted topic name>" }`;

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a topic extraction engine. Output JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error("Backend proxy error");
      const data = await response.json();
      const parsed = JSON.parse(data.content);
      return parsed.topic?.trim() || message;
    } catch (e) {
      console.error('extractTopic error:', e);
      return message; // fallback to raw message
    }
  }

  async getGeneralResponse(message: string, chatHistory: ChatMessage[] = []): Promise<string> {
    const systemPrompt = "You are Pace AI, a helpful and friendly AI tutor. Answer the user casually and concisely. If they ask to learn something, gently remind them to provide a specific topic.";

    const formattedHistory = chatHistory.slice(-6).map(msg => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.text
    }));

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...formattedHistory,
            { role: "user", content: message }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error("Backend proxy error");
      const data = await response.json();
      return data.content || "Sorry, I couldn't process that.";
    } catch (e) {
      console.error(e);
      throw new Error("Local backend proxy is unreachable.");
    }
  }

  async getExplanation(
    topic: string, 
    method: TeachingMethod, 
    isRetry: boolean = false, 
    chatHistory: ChatMessage[] = [],
    onChunk?: (chunkText: string) => void
  ): Promise<string> {
    let retryInstruction = "";
    if (isRetry && (method === TeachingMethod.STANDARD || method === TeachingMethod.CHILD_FRIENDLY)) {
      retryInstruction = "The user indicated they didn't understand your previous explanation. Please try a different angle, rephrase it, or provide a concrete example. ";
    }
    
    const systemInstruction = `You are Pace AI, an expert AI Tutor. Your current goal is to teach the user about "${topic}".
${retryInstruction}Explain this using ${this.getMethodDescription(method)}
Please structure your explanation with clear headings (e.g., ## Introduction, ## Key Concepts) and use markdown formatting for readability. Do not end your message by asking a question. Note: You will be passed recent conversation history.`;

    const formattedHistory = chatHistory.slice(-6).map(msg => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.text
    }));

    const messages = [
      { role: "system", content: systemInstruction },
      ...formattedHistory,
      { role: "user", content: `Please explain "${topic}" to me.` }
    ];

    try {
      const response = await fetch(`${API_BASE}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          temperature: method === TeachingMethod.CHILD_FRIENDLY ? 0.8 : 0.4
        })
      });

      if (!response.ok) throw new Error("Backend proxy error");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let finalExplanation = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        // The server sends SSE-like text: data: {...}\n\ndata: [DONE]\n\n
        const lines = chunkStr.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) {
                finalExplanation += parsed.content;
                if (onChunk) onChunk(parsed.content);
              }
            } catch (e) {
              // Usually partial JSON chunks, ignore safely
            }
          }
        }
      }
      return finalExplanation;
    } catch (error) {
      console.error("Error fetching generic explanation:", error);
      throw new Error(`Failed to fetch explanation from backend.`);
    }
  }

  async generateQuestions(topic: string, method: TeachingMethod, explanationText: string, numQuestions: number): Promise<QuizQuestion[]> {
    const prompt = `Topic: "${topic}"\nTeaching Method Used: "${this.getMethodDescription(method)}"\n\nExplanation Provided:\n---\n${explanationText}\n---\nBased EXCLUSIVELY on the Explanation Provided, generate ${numQuestions} multiple-choice quiz questions focusing on the core concepts.
Return ONLY valid JSON with a single key "questions" containing an array of question objects. Example format:
{
  "questions": [
    {
      "questionText": "What is the capital of France?",
      "options": ["Berlin", "Madrid", "Paris", "Rome"],
      "correctOptionIndex": 2
    }
  ]
}`;

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
              { role: "system", content: "You are an AI quiz generator. Output JSON only." },
              { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        })
      });

      if (!response.ok) throw new Error("Backend proxy error");
      const data = await response.json();
      const parsed = JSON.parse(data.content);
      
      if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed.questions as QuizQuestion[];
      }
      throw new Error("Parsed data was invalid format");
    } catch (error) {
      console.error("Error generating questions from AI:", error);
      throw new Error(`Failed to generate quiz questions.`);
    }
  }

  async generateSyllabus(topic: string): Promise<string[]> {
    const prompt = `The user wants to learn about: "${topic}".
Generate a structured, logical learning roadmap for this topic. 
Break it down into 3 to 5 sequential curriculum steps that start from the basics and move to more advanced concepts.
Return ONLY valid JSON with a single key "steps" containing a string array of the steps. Keep the steps extremely concise.
Example:
{
  "steps": ["Variables and Data Types", "Control Flow", "Functions", "Object-Oriented Programming"]
}`;

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
              { role: "system", content: "You are an expert curriculum designer. Output JSON only." },
              { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        })
      });

      if (!response.ok) throw new Error("Backend proxy error");
      const data = await response.json();
      const parsed = JSON.parse(data.content);

      if (parsed.steps && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        return parsed.steps as string[];
      }
      throw new Error("Parsed syllabus data was invalid format");
    } catch (error) {
      console.error("Error generating syllabus from AI:", error);
      throw new Error(`Failed to generate syllabus.`);
    }
  }
}
