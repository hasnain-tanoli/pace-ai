import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 3001;
const GROQ_MODEL = "llama-3.1-8b-instant";

const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
if (!apiKey) {
    console.warn("WARNING: VITE_GROQ_API_KEY is not defined in .env");
}

const ai = new Groq({ dangerouslyAllowBrowser: false, apiKey });

// Standard non-streaming chat endpoint (for syllabus, quizzes, intent)
app.post('/api/chat', async (req, res) => {
  const { messages, temperature = 0.5, response_format } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  try {
    const config = {
      model: GROQ_MODEL,
      messages,
      temperature,
    };
    
    if (response_format) {
      config.response_format = response_format;
    }
    
    const response = await ai.chat.completions.create(config);
    res.json(response.choices[0]?.message);
  } catch (error) {
    console.error("error in /api/chat:", error);
    res.status(500).json({ error: error.message });
  }
});

// Streaming chat endpoint (for explanations / long responses)
app.post('/api/stream', async (req, res) => {
  const { messages, temperature = 0.5 } = req.body;
  
  try {
    const stream = await ai.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature,
      stream: true,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).end();
  }
});

app.get('/api/health', (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Pace AI Proxy running on http://localhost:${PORT}`);
});
