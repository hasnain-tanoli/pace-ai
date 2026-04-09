import React, { memo } from 'react';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = memo(({ message }) => {
  const isAI = message.sender === 'ai';

  return (
    <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'} w-full group`}>
      <div className={`flex gap-4 max-w-[90%] sm:max-w-[85%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Modern Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-500 shadow-sm ${isAI
            ? 'bg-[var(--ink-heading)] text-[var(--bg-app)]'
            : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--ink)]'
            }`}>
            {isAI ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col gap-2 ${isAI ? 'items-start' : 'items-end'}`}>
          <div className={`px-7 py-6 rounded-[24px] transition-all duration-500 ${isAI
            ? 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--ink)] shadow-sm group-hover:shadow-md rounded-tl-none'
            : 'bg-[var(--ink-heading)] text-[var(--bg-app)] shadow-lg rounded-tr-none'
            }`}>
            <div className={`prose max-w-none transition-colors duration-500 ${isAI ? 'text-[var(--ink)]' : 'text-[var(--bg-app)] prose-invert'}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          </div>

          {/* Subtle Metadata */}
          {isAI && (
            <div className="flex items-center gap-2 px-1">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-[var(--ink-muted)] uppercase tracking-widest font-display transition-colors duration-500">
                Response
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatBubble.displayName = 'ChatBubble';