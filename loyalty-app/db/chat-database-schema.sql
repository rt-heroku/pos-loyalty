-- Chat System Database Schema
-- This file contains the database tables and functions needed for the chat system
/*
drop table if exists chat_sessions;
drop table if exists chat_messages;
drop table if exists chat_attachments;
drop index if exists idx_chat_sessions_user_id;
drop index if exists idx_chat_sessions_created_at;
drop index if exists idx_chat_sessions_active;
drop index if exists idx_chat_messages_session_id;
drop index if exists idx_chat_messages_user_id;
drop index if exists idx_chat_messages_created_at;
drop index if exists idx_chat_messages_status;
drop index if exists idx_chat_attachments_message_id;
drop index if exists idx_chat_attachments_uploaded_at;
drop function if exists create_ai_chat_session;
drop function if exists add_chat_message;
drop function if exists get_chat_session_with_messages;
drop function if exists get_user_ai_chat_sessions;
drop function if exists update_chat_message_status;
drop function if exists add_chat_attachment;
drop function if exists get_chat_message_attachments;
*/
-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for chat_sessions table
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_active ON chat_sessions(is_active);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'attachment', 'system')),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
    is_from_user BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for chat_messages table
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);

-- Chat Attachments Table
CREATE TABLE IF NOT EXISTS chat_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for chat_attachments table
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON chat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_uploaded_at ON chat_attachments(uploaded_at);

-- Chat Settings in System Settings
-- These will be added using the existing system settings functions

-- Function to create a new chat session
CREATE OR REPLACE FUNCTION create_ai_chat_session(
    p_user_id INTEGER,
    p_title VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO chat_sessions (user_id, title)
    VALUES (p_user_id, p_title)
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add a message to a chat session
CREATE OR REPLACE FUNCTION add_chat_message(
    p_session_id UUID,
    p_user_id INTEGER,
    p_content TEXT,
    p_is_from_user BOOLEAN,
    p_type VARCHAR(20) DEFAULT 'text',
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    message_id UUID;
BEGIN
    INSERT INTO chat_messages (session_id, user_id, content, type, is_from_user, metadata)
    VALUES (p_session_id, p_user_id, p_content, p_type, p_is_from_user, p_metadata)
    RETURNING id INTO message_id;
    
    -- Update session last message timestamp
    UPDATE chat_sessions 
    SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_session_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get chat session with messages
CREATE OR REPLACE FUNCTION get_chat_session_with_messages(
    p_session_id UUID,
    p_user_id INTEGER
) RETURNS TABLE (
    session_id UUID,
    session_title VARCHAR(255),
    session_created_at TIMESTAMP WITH TIME ZONE,
    session_updated_at TIMESTAMP WITH TIME ZONE,
    session_last_message_at TIMESTAMP WITH TIME ZONE,
    session_is_active BOOLEAN,
    session_metadata JSONB,
    message_id UUID,
    message_content TEXT,
    message_type VARCHAR(20),
    message_status VARCHAR(20),
    message_is_from_user BOOLEAN,
    message_created_at TIMESTAMP WITH TIME ZONE,
    message_metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id as session_id,
        cs.title as session_title,
        cs.created_at as session_created_at,
        cs.updated_at as session_updated_at,
        cs.last_message_at as session_last_message_at,
        cs.is_active as session_is_active,
        cs.metadata as session_metadata,
        cm.id as message_id,
        cm.content as message_content,
        cm.type as message_type,
        cm.status as message_status,
        cm.is_from_user as message_is_from_user,
        cm.created_at as message_created_at,
        cm.metadata as message_metadata
    FROM chat_sessions cs
    LEFT JOIN chat_messages cm ON cs.id = cm.session_id
    WHERE cs.id = p_session_id AND cs.user_id = p_user_id
    ORDER BY cm.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's chat sessions
CREATE OR REPLACE FUNCTION get_user_ai_chat_sessions(
    p_user_id INTEGER,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    metadata JSONB,
    message_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.title,
        cs.created_at,
        cs.updated_at,
        cs.last_message_at,
        cs.is_active,
        cs.metadata,
        COUNT(cm.id) as message_count
    FROM chat_sessions cs
    LEFT JOIN chat_messages cm ON cs.id = cm.session_id
    WHERE cs.user_id = p_user_id
    GROUP BY cs.id, cs.title, cs.created_at, cs.updated_at, cs.last_message_at, cs.is_active, cs.metadata
    ORDER BY cs.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to update message status
CREATE OR REPLACE FUNCTION update_chat_message_status(
    p_message_id UUID,
    p_status VARCHAR(20)
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE chat_messages 
    SET status = p_status, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_message_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to add attachment to message
CREATE OR REPLACE FUNCTION add_chat_attachment(
    p_message_id UUID,
    p_file_name VARCHAR(255),
    p_file_size BIGINT,
    p_mime_type VARCHAR(100),
    p_file_path VARCHAR(500),
    p_thumbnail_path VARCHAR(500) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    attachment_id UUID;
BEGIN
    INSERT INTO chat_attachments (message_id, file_name, file_size, mime_type, file_path, thumbnail_path)
    VALUES (p_message_id, p_file_name, p_file_size, p_mime_type, p_file_path, p_thumbnail_path)
    RETURNING id INTO attachment_id;
    
    RETURN attachment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get message attachments
CREATE OR REPLACE FUNCTION get_chat_message_attachments(
    p_message_id UUID
) RETURNS TABLE (
    id UUID,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    file_path VARCHAR(500),
    thumbnail_path VARCHAR(500),
    uploaded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.id,
        ca.file_name,
        ca.file_size,
        ca.mime_type,
        ca.file_path,
        ca.thumbnail_path,
        ca.uploaded_at
    FROM chat_attachments ca
    WHERE ca.message_id = p_message_id
    ORDER BY ca.uploaded_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Insert default chat settings
SELECT set_system_setting('chat_enabled', 'true', 'Enable/disable chat functionality', 'chat', 'system');
SELECT set_system_setting('chat_api_url', 'https://your-mulesoft-api.com/chat', 'Mulesoft chat API endpoint', 'chat', 'system');
SELECT set_system_setting('chat_floating_button', 'true', 'Show floating chat button', 'chat', 'system');
SELECT set_system_setting('chat_max_file_size', '10485760', 'Maximum file size in bytes (10MB)', 'chat', 'system');
SELECT set_system_setting('chat_allowed_file_types', 'image/jpeg,image/png,image/gif,application/pdf,text/plain', 'Allowed file types for chat attachments', 'chat', 'system');
SELECT set_system_setting('chat_typing_indicator_delay', '1000', 'Delay in ms before showing typing indicator', 'chat', 'system');
SELECT set_system_setting('chat_message_retry_attempts', '3', 'Number of retry attempts for failed messages', 'chat', 'system');
SELECT set_system_setting('chat_session_timeout', '3600000', 'Session timeout in ms (1 hour)', 'chat', 'system');
