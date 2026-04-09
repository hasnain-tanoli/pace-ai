# Pace AI

## Overview

**Pace AI** is a premium, interactive AI Tutor web application designed to deliver a personalized and immersive learning experience. Built with a sophisticated **Slate & Silk** design system, it leverages advanced language models to provide deep explanations, dynamic assessments, and a visualized learning roadmap.

Unlike traditional learning platforms, Pace AI adapts its pedagogical approach in real-time, transitioning between simplified, standard, and technical explanations based on user comprehension.

## Features

*   **Premium Interactive Chat**: Engage with an AI tutor through a sleek, high-performance interface with glassmorphism and fluid animations.
*   **Dynamic Syllabus Roadmap**: Visualize your learning journey with an interactive roadmap that tracks your progress through complex topics.
*   **Real-time Mastery Tracking**: Monitor your comprehension levels via a dedicated Mastery Panel, providing instant feedback on your grasp of the subject.
*   **Adaptive Learning Methods**: Choose from high-level, simplified, or child-friendly explanations. The tutor automatically adjusts if you find a concept challenging.
*   **Intelligent Assessment**: Test your knowledge with dynamically generated quizzes that adapt to the content currently being mastered.
*   **Mathematical Excellence**: Full support for complex LaTeX equations and mathematical rendering using KaTeX.
*   **Midnight Silk Dark Mode**: A premium dark theme designed for focus and reduced eye strain.

## Technologies Used

### Frontend
*   **React 19**: Modern UI library with the latest concurrent features.
*   **TypeScript**: Ensuring type safety across the entire codebase.
*   **Vite**: Next-generation frontend tooling for instantaneous hot module replacement.
*   **Slate & Silk CSS**: A custom-built, premium SaaS design system using pure Vanilla CSS.
*   **Zustand**: Lightweight, high-performance state management.
*   **React Markdown & KaTeX**: For beautiful rendering of technical and mathematical content.

### Backend & AI
*   **Node.js & Express**: Secure proxy server for managing API interactions.
*   **Google Gemini API**: Advanced LLM for core tutor logic and explanation generation.
*   **Groq SDK**: High-speed inference engine for low-latency responses.

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm, pnpm, or yarn
*   A Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/hasnain-tanoli/pace-ai.git
    cd pace-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    # If using Groq:
    # GROQ_API_KEY=YOUR_GROQ_API_KEY
    ```

### Running the Application

To start both the proxy server and the Vite development environment:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Project Structure

*   **/components**: Reusable UI components.
    *   `SyllabusSidebar.tsx`: Navigation and progress tracking.
    *   `MasteryPanel.tsx`: Skill assessment and comprehension metrics.
    *   `ChatBubble.tsx`: Premium message containers.
    *   `QuizDisplay.tsx`: Adaptive testing interface.
    *   `SyllabusRoadmap.tsx`: Interactive learning path visualization.
*   **/services**: Integration layers for Gemini and Groq.
*   **/store**: Zustand state management logic.
*   **/utils**: Helper functions and markdown processors.
*   `server.js`: Express proxy server for secure API calls.
*   `App.tsx`: Main application orchestrator.
*   `index.css`: The "Slate & Silk" design system.

## License

This project is open-source and available under the [MIT License](LICENSE).