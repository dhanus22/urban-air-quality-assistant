import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';

export interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      role="log"
      aria-label={`${isUser ? 'You' : 'Assistant'} said: ${message.content.slice(0, 50)}...`}
      className={`flex items-start gap-3 my-3 w-full ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-teal-600 text-white ring-2 ring-teal-100'
        }`}
        aria-hidden="true"
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Message Bubble Container */}
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-xs text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-xs'
              : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-slate max-w-none text-slate-800">
              <ReactMarkdown
                components={{
                  h1: ({ ...props }) => (
                    <h1 className="text-base font-bold text-slate-900 mt-2 mb-1" {...props} />
                  ),
                  h2: ({ ...props }) => (
                    <h2 className="text-sm font-bold text-slate-900 mt-2 mb-1" {...props} />
                  ),
                  h3: ({ ...props }) => (
                    <h3 className="text-sm font-semibold text-teal-800 mt-2 mb-1" {...props} />
                  ),
                  p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({ ...props }) => (
                    <ul className="list-disc pl-4 space-y-1 my-2" {...props} />
                  ),
                  ol: ({ ...props }) => (
                    <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />
                  ),
                  li: ({ ...props }) => <li className="text-slate-700" {...props} />,
                  strong: ({ ...props }) => (
                    <strong className="font-semibold text-slate-900" {...props} />
                  ),
                  blockquote: ({ ...props }) => (
                    <blockquote
                      className="border-l-3 border-teal-500 pl-3 italic text-slate-600 my-2"
                      {...props}
                    />
                  ),
                  code: ({ ...props }) => (
                    <code
                      className="bg-slate-100 text-teal-800 px-1 py-0.5 rounded font-mono text-xs"
                      {...props}
                    />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {formattedTime && (
          <span
            className="text-[11px] text-slate-400 mt-1 px-1"
            aria-label={`Sent at ${formattedTime}`}
          >
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
