'use client';

import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (message.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center"
      >
        <div className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex',
        message.isFromUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          message.isFromUser
            ? 'rounded-br-md bg-primary-500 text-white'
            : 'rounded-bl-md bg-gray-100 text-gray-900'
        )}
      >
        {/* Message Content */}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, index) => (
              <motion.div
                key={attachment.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex items-center space-x-2 rounded-lg border p-2',
                  message.isFromUser
                    ? 'border-primary-300 bg-primary-400'
                    : 'border-gray-200 bg-white'
                )}
              >
                {getFileIcon(attachment.mimeType)}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {attachment.fileName}
                  </div>
                  <div className="text-xs opacity-75">
                    {formatFileSize(attachment.fileSize)}
                  </div>
                </div>
                <button
                  onClick={() => window.open(attachment.filePath, '_blank')}
                  className="rounded p-1 transition-colors hover:bg-black/10"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Message Footer */}
        <div
          className={cn(
            'mt-1 flex items-center justify-between text-xs',
            message.isFromUser ? 'text-primary-100' : 'text-gray-500'
          )}
        >
          <span>{formatTimestamp(message.timestamp)}</span>
          <div className="flex items-center space-x-1">{getStatusIcon()}</div>
        </div>

        {/* Suggested Actions */}
        {message.metadata?.suggestedActions && (
          <div className="mt-2 space-y-1">
            {message.metadata.suggestedActions.map(
              (action: any, index: number) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => {
                    if (action.action === 'redirect' && action.url) {
                      window.location.href = action.url;
                    }
                  }}
                  className={cn(
                    'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    message.isFromUser
                      ? 'bg-primary-400 text-white hover:bg-primary-300'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {action.label}
                </motion.button>
              )
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
