import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { MulesoftChatRequest, MulesoftChatResponse } from '@/types/chat';

// Mulesoft API integration function
async function sendToMulesoftAPI(
  chatRequest: MulesoftChatRequest,
  apiUrl: string
): Promise<MulesoftChatResponse> {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MULESOFT_API_TOKEN}`,
      },
      body: JSON.stringify(chatRequest),
    });

    if (!response.ok) {
      throw new Error(
        `Mulesoft API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Mulesoft API error:', error);
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Failed to connect to chat service',
        details: {
          originalError:
            error instanceof Error ? error.message : 'Unknown error',
        },
      },
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { sessionId, message, attachments = [] } = await request.json();

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const sessionResult = await query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, user.id]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Add user message to database
    const messageResult = await query(
      'SELECT add_chat_message($1, $2, $3, $4, $5, $6) as message_id',
      [sessionId, user.id, message, true, 'text', '{}']
    );

    const userMessageId = messageResult.rows[0].message_id;

    // Add attachments if any
    for (const attachment of attachments) {
      await query('SELECT add_chat_attachment($1, $2, $3, $4, $5, $6)', [
        userMessageId,
        attachment.fileName,
        attachment.fileSize,
        attachment.mimeType,
        attachment.filePath,
        attachment.thumbnailPath,
      ]);
    }

    // Get chat settings
    const settingsResult = await query(
      'SELECT get_system_setting_or_default($1, $2) as value',
      ['chat_api_url', 'https://your-mulesoft-api.com/chat/v1/messages']
    );

    const apiUrl = settingsResult.rows[0].value;

    // Prepare request for Mulesoft API
    const mulesoftRequest: MulesoftChatRequest = {
      message,
      userId: user.id.toString(),
      sessionId,
      attachments: attachments.map((att: any) => ({
        fileName: att.fileName,
        mimeType: att.mimeType,
        fileData: att.fileData || '', // This should be base64 encoded file data
      })),
      metadata: {
        userAgent: request.headers.get('user-agent') || '',
        timestamp: new Date().toISOString(),
        source: 'web',
      },
    };

    // Send to Mulesoft API
    const mulesoftResponse = await sendToMulesoftAPI(mulesoftRequest, apiUrl);

    if (!mulesoftResponse.success) {
      // Update user message status to failed
      await query('SELECT update_chat_message_status($1, $2)', [
        userMessageId,
        'failed',
      ]);

      return NextResponse.json(
        {
          error:
            mulesoftResponse.error?.message ||
            'Failed to get response from AI agent',
          details: mulesoftResponse.error,
        },
        { status: 500 }
      );
    }

    // Add AI response to database
    const aiMessageResult = await query(
      'SELECT add_chat_message($1, $2, $3, $4, $5, $6) as message_id',
      [
        sessionId,
        user.id,
        mulesoftResponse.message || '',
        false,
        'text',
        JSON.stringify({
          agentId: mulesoftResponse.agentId,
          conversationId: mulesoftResponse.conversationId,
          messageId: mulesoftResponse.messageId,
          ...mulesoftResponse.metadata,
        }),
      ]
    );

    const aiMessageId = aiMessageResult.rows[0].message_id;

    // Add AI attachments if any
    if (mulesoftResponse.attachments) {
      for (const attachment of mulesoftResponse.attachments) {
        // In a real implementation, you'd save the file data and get a file path
        const filePath = `/attachments/ai/${attachment.fileName}`;

        await query('SELECT add_chat_attachment($1, $2, $3, $4, $5, $6)', [
          aiMessageId,
          attachment.fileName,
          attachment.fileData.length, // Approximate file size
          attachment.mimeType,
          filePath,
          null,
        ]);
      }
    }

    // Update user message status to delivered
    await query('SELECT update_chat_message_status($1, $2)', [
      userMessageId,
      'delivered',
    ]);

    return NextResponse.json({
      success: true,
      userMessage: {
        id: userMessageId,
        content: message,
        type: 'text',
        status: 'delivered',
        isFromUser: true,
        createdAt: new Date(),
        attachments,
      },
      aiMessage: {
        id: aiMessageId,
        content: mulesoftResponse.message,
        type: 'text',
        status: 'sent',
        isFromUser: false,
        createdAt: new Date(),
        metadata: {
          agentId: mulesoftResponse.agentId,
          conversationId: mulesoftResponse.conversationId,
          messageId: mulesoftResponse.messageId,
          ...mulesoftResponse.metadata,
        },
      },
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
