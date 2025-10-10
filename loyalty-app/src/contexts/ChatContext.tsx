'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { ChatState, ChatSettings } from '@/types/chat';

interface ChatContextType {
  // State
  chatState: ChatState;
  chatSettings: ChatSettings | null;

  // Actions
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  maximizeChat: () => void;
  sendMessage: (content: string, attachments?: any[]) => Promise<void>;
  clearChat: () => Promise<void>;
  loadChatSettings: () => Promise<void>;

  // Getters
  isChatEnabled: boolean;
  shouldShowFloatingButton: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    isMinimized: false,
    currentSession: null,
    messages: [],
    typingIndicator: null,
    isConnected: false,
    isSending: false,
    error: null,
    unreadCount: 0,
  });

  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);

  // Load chat settings on mount
  useEffect(() => {
    loadChatSettings();
  }, []);

  const loadChatSettings = async () => {
    try {
      const response = await fetch('/loyalty/api/chat/settings');
      const data = await response.json();

      if (data.settings) {
        setChatSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading chat settings:', error);
    }
  };

  const openChat = () => {
    setChatState(prev => ({
      ...prev,
      isOpen: true,
      isMinimized: false,
      unreadCount: 0,
    }));
  };

  const closeChat = () => {
    setChatState(prev => ({
      ...prev,
      isOpen: false,
      isMinimized: false,
    }));
  };

  const minimizeChat = () => {
    setChatState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized,
    }));
  };

  const maximizeChat = () => {
    setChatState(prev => ({
      ...prev,
      isMinimized: false,
    }));
  };

  const sendMessage = async (content: string, attachments: any[] = []) => {
    if (!content.trim() && attachments.length === 0) return;
    if (!chatState.currentSession) return;

    setChatState(prev => ({ ...prev, isSending: true, error: null }));

    try {
      const response = await fetch('/loyalty/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: chatState.currentSession.id,
          message: content,
          attachments,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, data.userMessage, data.aiMessage],
          unreadCount: 0,
        }));
      } else {
        setChatState(prev => ({
          ...prev,
          error: data.error || 'Failed to send message',
        }));
      }
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        error: 'Network error. Please try again.',
      }));
    } finally {
      setChatState(prev => ({ ...prev, isSending: false }));
    }
  };

  const clearChat = async () => {
    if (!chatState.currentSession) return;

    try {
      await fetch(`/loyalty/api/chat/sessions/${chatState.currentSession.id}`, {
        method: 'DELETE',
      });

      setChatState(prev => ({
        ...prev,
        messages: [],
        currentSession: null,
      }));
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const isChatEnabled = chatSettings?.chatEnabled ?? false;
  const shouldShowFloatingButton = chatSettings?.chatFloatingButton ?? false;

  const value: ChatContextType = {
    chatState,
    chatSettings,
    openChat,
    closeChat,
    minimizeChat,
    maximizeChat,
    sendMessage,
    clearChat,
    loadChatSettings,
    isChatEnabled,
    shouldShowFloatingButton,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
