'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  Send,
  Paperclip,
  Download,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatWindowProps,
  ChatMessage,
  ChatSession,
  TypingIndicator,
} from '@/types/chat';
import ChatMessageComponent from './ChatMessage';
import TypingIndicatorComponent from './TypingIndicator';
import FileUploadModal from './FileUploadModal';

interface ChatWindowState {
  isMinimized: boolean;
  isMaximized: boolean;
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  typingIndicator: TypingIndicator | null;
  isSending: boolean;
  inputValue: string;
  showFileUpload: boolean;
  unreadCount: number;
}

export default function ChatWindow({
  isOpen,
  onClose,
  className = '',
}: ChatWindowProps) {
  const [state, setState] = useState<ChatWindowState>({
    isMinimized: false,
    isMaximized: false,
    messages: [],
    currentSession: null,
    typingIndicator: null,
    isSending: false,
    inputValue: '',
    showFileUpload: false,
    unreadCount: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && state.messages.length > 0) {
      scrollToBottom();
    }
  }, [isOpen, state.messages, scrollToBottom]);

  const loadOrCreateSession = useCallback(async () => {
    try {
      // Try to get existing active session
      const response = await fetch('/loyalty/api/chat/sessions?limit=1');
      const data = await response.json();

      if (data.sessions && data.sessions.length > 0) {
        const session = data.sessions[0];
        await loadSessionMessages(session.id);
      } else {
        // Create new session
        await createNewSession();
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load chat session when window opens
  useEffect(() => {
    if (isOpen && !state.currentSession) {
      loadOrCreateSession();
    }
  }, [isOpen, loadOrCreateSession, state.currentSession]);

  const createNewSession = useCallback(async () => {
    try {
      const response = await fetch('/loyalty/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });

      const data = await response.json();
      if (data.sessionId) {
        await loadSessionMessages(data.sessionId);
      }
    } catch (error) {
      console.error('Error creating chat session:', error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/loyalty/api/chat/sessions/${sessionId}`);
      const data = await response.json();

      if (data.session) {
        setState(prev => ({
          ...prev,
          currentSession: data.session,
          messages: data.session.messages || [],
        }));
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
    }
  }, []);

  const sendMessage = async (content: string, attachments: any[] = []) => {
    if (!content.trim() && attachments.length === 0) return;
    if (!state.currentSession) return;

    setState(prev => ({ ...prev, isSending: true, inputValue: '' }));

    try {
      const response = await fetch('/loyalty/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.currentSession.id,
          message: content,
          attachments,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, data.userMessage, data.aiMessage],
          unreadCount: 0,
        }));
      } else {
        console.error('Error sending message:', data.error);
        // Show error message
        setState(prev => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: Date.now().toString(),
              userId: '',
              sessionId: state.currentSession!.id,
              content: 'Sorry, I encountered an error. Please try again.',
              type: 'system',
              status: 'sent',
              isFromUser: false,
              timestamp: new Date(),
            },
          ],
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setState(prev => ({ ...prev, isSending: false }));
    }
  };

  const handleSendMessage = () => {
    if (state.inputValue.trim()) {
      sendMessage(state.inputValue.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (files: File[]) => {
    // Process file uploads
    const attachments = files.map(file => ({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      filePath: URL.createObjectURL(file), // Temporary URL for preview
      fileData: '', // Will be populated when sending
    }));

    sendMessage('', attachments);
  };

  const clearChat = async () => {
    if (!state.currentSession) return;

    try {
      await fetch(`/loyalty/api/chat/sessions/${state.currentSession.id}`, {
        method: 'DELETE',
      });

      setState(prev => ({
        ...prev,
        messages: [],
        currentSession: null,
      }));

      await createNewSession();
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const exportChat = () => {
    if (!state.messages.length) return;

    const chatData = {
      session: state.currentSession,
      messages: state.messages,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className={`
        fixed bottom-6 right-6 z-50 rounded-2xl border border-gray-200 bg-white shadow-2xl
        ${state.isMinimized ? 'h-16 w-80' : state.isMaximized ? 'h-[80vh] w-96' : 'h-96 w-80'}
        ${className}
      `}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        width: state.isMinimized ? 320 : state.isMaximized ? 384 : 320,
        height: state.isMinimized ? 64 : state.isMaximized ? '80vh' : 384,
      }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-green-400" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() =>
              setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }))
            }
            className="rounded p-1 transition-colors hover:bg-white/20"
          >
            {state.isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!state.isMinimized && (
        <>
          {/* Messages Area */}
          <div className="h-64 flex-1 space-y-4 overflow-y-auto p-4">
            <AnimatePresence>
              {state.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ChatMessageComponent message={message} />
                </motion.div>
              ))}
            </AnimatePresence>

            {state.typingIndicator && (
              <TypingIndicatorComponent indicator={state.typingIndicator} />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-end space-x-2">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={state.inputValue}
                  onChange={e =>
                    setState(prev => ({ ...prev, inputValue: e.target.value }))
                  }
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full resize-none rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                <button
                  onClick={() =>
                    setState(prev => ({ ...prev, showFileUpload: true }))
                  }
                  className="absolute bottom-2 right-2 p-1 text-gray-400 transition-colors hover:text-primary-500"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!state.inputValue.trim() || state.isSending}
                className="rounded-lg bg-primary-500 p-3 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Actions */}
          <div className="flex items-center justify-between rounded-b-2xl border-t border-gray-100 bg-gray-50 p-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={clearChat}
                className="p-2 text-gray-400 transition-colors hover:text-red-500"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={exportChat}
                className="p-2 text-gray-400 transition-colors hover:text-primary-500"
                title="Export chat"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className="text-xs text-gray-400">
              {state.messages.length} messages
            </div>
          </div>
        </>
      )}

      {/* File Upload Modal */}
      {state.showFileUpload && (
        <FileUploadModal
          isOpen={state.showFileUpload}
          onClose={() => setState(prev => ({ ...prev, showFileUpload: false }))}
          onUpload={handleFileUpload}
        />
      )}
    </motion.div>
  );
}
