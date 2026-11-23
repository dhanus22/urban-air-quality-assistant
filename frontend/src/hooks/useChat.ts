import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { api } from '../services/api';

export interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (text: string, city?: string) => Promise<void>;
  clearMessages: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `👋 **Welcome to your Urban Air Quality Assistant!**\n\nI can help you evaluate current outdoor risks, choose the right particulate protection, optimize indoor airflow, and schedule pollution-safe activities.\n\nTry asking me a question or tap one of the suggested prompts below!`,
  timestamp: new Date().toISOString(),
};

export function useChat(initialCity?: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string, city?: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [...messages, userMsg];
      setMessages(updatedHistory);
      setLoading(true);
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await api.chat(
          {
            message: trimmed,
            city: city || initialCity,
            history: updatedHistory,
          },
          controller.signal
        );

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          timestamp: response.timestamp || new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;

        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Sorry, I encountered an issue fetching air quality advice.';
        setError(errorMsg);

        const errorAssistantMsg: ChatMessage = {
          id: `assistant-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Unable to process response**: ${errorMsg}. Please try asking again.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorAssistantMsg]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, initialCity]
  );

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([INITIAL_MESSAGE]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    messagesEndRef,
  };
}
