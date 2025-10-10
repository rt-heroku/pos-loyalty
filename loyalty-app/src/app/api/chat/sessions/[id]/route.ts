import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const sessionId = params.id;

    const result = await query(
      'SELECT * FROM get_chat_session_with_messages($1, $2)',
      [sessionId, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Group messages by session
    const session = {
      id: result.rows[0].session_id,
      title: result.rows[0].session_title,
      createdAt: result.rows[0].session_created_at,
      updatedAt: result.rows[0].session_updated_at,
      lastMessageAt: result.rows[0].session_last_message_at,
      isActive: result.rows[0].session_is_active,
      metadata: result.rows[0].session_metadata,
      messages: result.rows
        .filter(row => row.message_id)
        .map(row => ({
          id: row.message_id,
          content: row.message_content,
          type: row.message_type,
          status: row.message_status,
          isFromUser: row.message_is_from_user,
          createdAt: row.message_created_at,
          metadata: row.message_metadata,
        })),
    };

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const sessionId = params.id;

    // Verify session belongs to user
    const sessionResult = await query(
      'SELECT id FROM ai_chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, user.id]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Delete session (cascade will delete messages and attachments)
    await query('DELETE FROM ai_chat_sessions WHERE id = $1', [sessionId]);

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}
