import React from 'react';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isAI = message.sender === 'ai';
  
  const bubbleClasses = isAI
    ? 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 text-slate-100 self-start rounded-2xl rounded-bl-md shadow-lg hover:shadow-xl transition-all duration-300'
    : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-400/20 text-slate-100 self-end rounded-2xl rounded-br-md shadow-lg hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300';
  
  const alignmentClass = isAI ? 'justify-start' : 'justify-end';
  const avatarOrderClass = isAI ? 'flex-row' : 'flex-row-reverse';

  const avatarContent = isAI ? (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ) : (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
  
  const avatarBgClass = isAI 
    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg' 
    : 'bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-lg';

  return (
    <div className={`flex ${alignmentClass} w-full group touch-optimized`}>
      <div className={`pt-5 flex items-end gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl ${avatarOrderClass} overflow-safe`}>
        <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full ${avatarBgClass} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
             style={{ minWidth: '2rem', minHeight: '2rem' }}>
          {avatarContent}
        </div>
        <div className={`relative px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4 ${bubbleClasses} group-hover:-translate-y-1 min-w-0 flex-1 overflow-safe`}>
          {/* Subtle glow effect for AI messages */}
          {isAI && (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          )}
          
          <div className="relative text-sm sm:text-base leading-relaxed prose prose-sm prose-invert w-full max-w-none overflow-safe">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {message.text}
            </ReactMarkdown>
          </div>
          
          <div className="flex items-center justify-end mt-2 sm:mt-3 pt-2 border-t border-white/5">
            <p className="text-xs text-slate-400 font-medium">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
            {isAI && (
              <div className="ml-2 flex items-center">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};