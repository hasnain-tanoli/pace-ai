# AI-Powered Tutor

## Overview

The **AI-Powered Tutor** is an interactive web application designed to facilitate personalized learning. This application leverages advanced AI capabilities to provide comprehensive explanations on a wide range of topics and assess understanding through dynamic quizzes. It offers a unique conversational learning experience, adapting its teaching approach to suit individual user needs and learning styles.

## Features

*   **Interactive Chat Interface**: Engage with an AI tutor in a conversational manner.
*   **Personalized Explanations**: Receive explanations on any topic, tailored to different teaching methods (Standard, Simplified, Child-Friendly).
*   **Dynamic Quizzes**: Test your understanding with automatically generated quizzes based on the explained topic.
*   **Adaptive Learning Path**: The tutor adapts its explanation method if you're confused, offering alternative approaches.
*   **Understanding Confirmation**: Confirm your grasp of a topic before moving on to quizzes.
*   **Quiz Results & Retries**: Get immediate feedback on your quiz performance and retry explanations if you don't pass.
*   **Responsive Design**: Optimized for various screen sizes, including mobile devices.
*   **Math Rendering**: Supports rendering of mathematical equations using KaTeX.

## Technologies Used

*   **React**: Frontend library for building the user interface.
*   **TypeScript**: Superset of JavaScript for type-safe development.
*   **Vite**: Fast build tool for modern web projects.
*   **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
*   **Google Gemini API**: Powers the AI tutor's conversational and content generation capabilities.
*   **React Markdown**: Renders Markdown content in React components.
*   **Remark GFM, Remark Math, Rehype KaTeX**: Markdown plugins for GitHub Flavored Markdown and mathematical equation rendering.

## Getting Started

Follow these instructions to set up and run the AI-Powered Tutor application locally.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or Yarn
*   A Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-powered-tutor.git
    cd ai-powered-tutor
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure your Google Gemini API Key:**
    Create a `.env` file in the root of the project and add your Gemini API key:
    ```
    VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
    Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key.

### Running the Application

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will typically be available at `http://localhost:5173`. Open this URL in your web browser.

## How to Use

1.  **Start a New Topic**: Upon launching the application, the AI tutor will greet you. Type the topic you wish to learn about in the input field and press Enter or click the send button.
2.  **Receive Explanation**: The AI will provide an explanation of the topic.
3.  **Confirm Understanding**: After the explanation, you'll be asked if you understand.
    *   Click "Yes, I understand" if you feel confident. This will lead to a quiz.
    *   Click "I'm confused" if you need further clarification. The AI will attempt to explain the topic again using a different teaching method (e.g., Simplified, Child-Friendly).
4.  **Take the Quiz**: If you confirm understanding, a multiple-choice quiz will appear. Select your answers and submit.
5.  **Review Results**: Your quiz results will be displayed, showing correct and incorrect answers.
    *   If you pass the quiz (score above 70%), the tutor will congratulate you and ask if you'd like to learn something new.
    *   If you don't pass, the tutor will suggest another explanation approach.
6.  **Start Over**: At any point, you can click the "New Topic" button in the header to clear the chat and start a fresh learning session.

## Project Structure

*   `public/`: Static assets like `favicon.ico` and `favicon.png`.
*   `src/`: Main application source code.
    *   `App.tsx`: The main React component orchestrating the application's logic and state.
    *   `constants.ts`: Defines application-wide constants.
    *   `types.d.ts`, `types.ts`: TypeScript type definitions for data structures.
    *   `components/`: Reusable UI components.
        *   `ActionButtons.tsx`: Buttons for user interaction (e.g., "Yes, I understand", "I'm confused").
        *   `ChatBubble.tsx`: Displays individual chat messages from the AI or user.
        *   `QuizDisplay.tsx`: Renders the quiz questions and handles user answers.
        *   `UserInput.tsx`: Input field for sending messages to the AI.
    *   `services/`: Contains service layers for external integrations.
        *   `GeminiService.ts`: Handles communication with the Google Gemini API.
    *   `index.css`: Global CSS styles.
    *   `index.html`: The main HTML file.
    *   `index.tsx`: Entry point for the React application.
    *   `vite.config.ts`: Vite build configuration.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is open-source and available under the [MIT License](LICENSE).