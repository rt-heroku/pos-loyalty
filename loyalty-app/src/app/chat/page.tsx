'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import {
  MessageCircle,
  Send,
  Paperclip,
  Download,
  Trash2,
  History,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from '@/components/chat/ChatMessage';
import TypingIndicator from '@/components/chat/TypingIndicator';
import FileUploadModal from '@/components/chat/FileUploadModal';
import { ChatSession } from '@/types/chat';

export default function ChatPage() {
  const { chatState, sendMessage, clearChat, loadChatSettings, isChatEnabled } =
    useChat();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadChatSettings();
    loadSessions();
  }, [loadChatSettings]);

  const loadSessions = async () => {
    try {
      const response = await fetch('/loyalty/api/chat/sessions?limit=20');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const createNewSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/loyalty/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });

      const data = await response.json();
      if (data.sessionId) {
        await loadSessions();
        // Load the new session
        await loadSessionMessages(data.sessionId);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/loyalty/api/chat/sessions/${sessionId}`);
      const data = await response.json();

      if (data.session) {
        // Update the current session in context
        // This would need to be implemented in the ChatContext
        console.log('Loaded session:', data.session);
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      await sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (files: File[]) => {
    sendMessage('', files);
    setShowFileUpload(false);
  };

  const exportChat = () => {
    if (!chatState.messages.length) return;

    const chatData = {
      session: chatState.currentSession,
      messages: chatState.messages,
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

  if (!isChatEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Chat Unavailable
          </h2>
          <p className="text-gray-600">
            Chat functionality is currently disabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl p-4">
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  AI Assistant
                </h1>
                <p className="mt-1 text-gray-600">
                  Get help with your loyalty program and account
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSessions(!showSessions)}
                  className="p-2 text-gray-400 transition-colors hover:text-gray-600"
                  title="Chat History"
                >
                  <History className="h-5 w-5" />
                </button>
                <button
                  onClick={exportChat}
                  className="p-2 text-gray-400 transition-colors hover:text-gray-600"
                  title="Export Chat"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={clearChat}
                  className="p-2 text-gray-400 transition-colors hover:text-red-500"
                  title="Clear Chat"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Chat Sessions Sidebar */}
          <AnimatePresence>
            {showSessions && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-1"
              >
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Chat History
                    </h3>
                    <button
                      onClick={createNewSession}
                      disabled={isLoading}
                      className="p-1 text-primary-500 transition-colors hover:text-primary-600"
                      title="New Chat"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {sessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => loadSessionMessages(session.id)}
                        className="w-full rounded-lg p-3 text-left transition-colors hover:bg-gray-50"
                      >
                        <div className="truncate text-sm font-medium text-gray-900">
                          {session.title || 'Untitled Chat'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Chat Area */}
          <div
            className={`${showSessions ? 'lg:col-span-3' : 'lg:col-span-4'}`}
          >
            <div className="flex h-[600px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
              {/* Messages Area */}
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <AnimatePresence>
                  {chatState.messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ChatMessage message={message} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {chatState.typingIndicator && (
                  <TypingIndicator indicator={chatState.typingIndicator} />
                )}

                {chatState.messages.length === 0 && (
                  <div className="py-12 text-center">
                    <MessageCircle className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      Start a Conversation
                    </h3>
                    <p className="text-gray-600">
                      Ask me anything about your loyalty program, account, or
                      get help with any questions you have.
                    </p>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex items-end space-x-3">
                  <div className="relative flex-1">
                    <textarea
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full resize-none rounded-xl border border-gray-300 p-4 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                      rows={1}
                      style={{ minHeight: '56px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={() => setShowFileUpload(true)}
                      className="absolute bottom-3 right-3 p-2 text-gray-400 transition-colors hover:text-primary-500"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || chatState.isSending}
                    className="rounded-xl bg-primary-500 p-4 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUploadModal
          isOpen={showFileUpload}
          onClose={() => setShowFileUpload(false)}
          onUpload={handleFileUpload}
        />
      )}
    </div>
  );
}
