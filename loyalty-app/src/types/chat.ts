export interface ChatMessage {
  id: string;
  userId: string;
  sessionId: string;
  content: string;
  type: 'text' | 'attachment' | 'system';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isFromUser: boolean;
  attachments?: ChatAttachment[];
  metadata?: {
    messageId?: string;
    agentId?: string;
    conversationId?: string;
    [key: string]: any;
  };
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  thumbnailPath?: string;
  uploadedAt: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  isActive: boolean;
  metadata?: {
    agentId?: string;
    conversationId?: string;
    [key: string]: any;
  };
}

export interface ChatSettings {
  chatEnabled: boolean;
  chatApiUrl: string;
  chatFloatingButton: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  typingIndicatorDelay: number;
  messageRetryAttempts: number;
  sessionTimeout: number;
}

export interface MulesoftChatRequest {
  message: string;
  userId: string;
  sessionId: string;
  conversationId?: string;
  attachments?: {
    fileName: string;
    mimeType: string;
    fileData: string; // base64 encoded
  }[];
  metadata?: {
    userAgent?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

export interface MulesoftChatResponse {
  success: boolean;
  message?: string;
  conversationId?: string;
  agentId?: string;
  messageId?: string;
  attachments?: {
    fileName: string;
    mimeType: string;
    fileData: string; // base64 encoded
  }[];
  metadata?: {
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface TypingIndicator {
  isTyping: boolean;
  agentId?: string;
  timestamp: Date;
}

export interface ChatState {
  isOpen: boolean;
  isMinimized: boolean;
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  typingIndicator: TypingIndicator | null;
  isConnected: boolean;
  isSending: boolean;
  error: string | null;
  unreadCount: number;
}

export interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export interface FloatingChatButtonProps {
  onClick: () => void;
  unreadCount: number;
  isVisible: boolean;
  className?: string;
}
