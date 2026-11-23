import React, { useState } from 'react';
import { Send, Sparkles, Trash2, MapPin, Loader2, Info } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import ChatMessage from '../components/ChatMessage';

const SUGGESTED_PROMPTS = [
  'Is it safe to go outside today?',
  'Best mask for smog protection?',
  'How to protect my children from pollution?',
  'What plants purify indoor air?',
  'How to make a DIY Corsi-Rosenthal box filter?',
  'What outdoor activities are safe at 150 AQI?',
];

export const ChatAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [cityContext, setCityContext] = useState('Delhi');
  const { messages, loading, sendMessage, clearMessages, messagesEndRef } =
    useChat(cityContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      sendMessage(input.trim(), cityContext);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePromptClick = (prompt: string) => {
    if (!loading) {
      sendMessage(prompt, cityContext);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-4.5rem)] flex flex-col">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5 text-teal-100" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              AI Air Quality Health Advisor
            </h1>
            <p className="text-xs text-slate-500">
              Personalized winter smog guidance backed by WHO standards and Gemini AI
            </p>
          </div>
        </div>

        {/* Location Context Selector & Reset */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <MapPin className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
            <label htmlFor="city-context-input" className="sr-only">
              City Context
            </label>
            <input
              id="city-context-input"
              type="text"
              value={cityContext}
              onChange={(e) => setCityContext(e.target.value)}
              placeholder="Your city..."
              className="bg-transparent border-none text-slate-700 font-semibold w-24 sm:w-28 focus:outline-hidden"
              title="City for localized advice"
            />
          </div>

          <button
            type="button"
            onClick={clearMessages}
            disabled={loading || messages.length <= 1}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors focus-visible:outline-teal-600 disabled:opacity-40"
            aria-label="Clear chat conversation history"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main Messages Scroll Area */}
      <div
        role="region"
        aria-label="Chat conversation log"
        className="flex-1 overflow-y-auto px-1 sm:px-2 py-4 space-y-4 bg-slate-100/50 rounded-2xl border border-slate-200/80 mb-4"
      >
        {messages.map((msg, index) => (
          <ChatMessage key={msg.id || index} message={msg} />
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div
            className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl px-4 py-3 w-fit shadow-xs animate-pulse"
            aria-live="polite"
          >
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" aria-hidden="true" />
            <span>Analyzing air quality telemetry and generating guidance...</span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Carousel / Wrap */}
      {messages.length <= 2 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <Info className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
            <span className="font-semibold">Recommended Questions:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                disabled={loading}
                className="shrink-0 text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-700 transition-colors font-medium shadow-2xs disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Bar */}
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl border border-slate-300 shadow-sm p-2 focus-within:ring-2 focus-within:ring-teal-600 focus-within:border-transparent transition-all">
        <label htmlFor="chat-user-input" className="sr-only">
          Ask a question about air quality or smog protection
        </label>
        <textarea
          id="chat-user-input"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about air pollution in ${cityContext || 'your city'}, mask types, air purifiers... (Press Enter to send)`}
          className="w-full resize-none border-none p-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
          disabled={loading}
        />
        <div className="flex items-center justify-between pt-1 px-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Shift + Enter for new line • Enter to submit
          </span>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="ml-auto px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 focus-visible:outline-teal-600 disabled:opacity-40"
            aria-label="Send message"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatAssistant;
