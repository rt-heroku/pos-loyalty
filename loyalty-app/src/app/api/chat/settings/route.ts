import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  getSystemSettingWithDefault,
  setSystemSetting,
} from '@/lib/system-settings';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get all chat-related settings using the global functions
    const chatSettings = {
      chatEnabled:
        (await getSystemSettingWithDefault('chat_enabled', 'true')) === 'true',
      chatApiUrl: await getSystemSettingWithDefault(
        'chat_api_url',
        'https://your-mulesoft-api.com/chat/v1/messages'
      ),
      chatFloatingButton:
        (await getSystemSettingWithDefault('chat_floating_button', 'true')) ===
        'true',
      maxFileSize: parseInt(
        await getSystemSettingWithDefault('chat_max_file_size', '10485760')
      ),
      allowedFileTypes: (
        await getSystemSettingWithDefault(
          'chat_allowed_file_types',
          'image/jpeg,image/png,image/gif,application/pdf,text/plain'
        )
      ).split(','),
      typingIndicatorDelay: parseInt(
        await getSystemSettingWithDefault('chat_typing_indicator_delay', '1000')
      ),
      messageRetryAttempts: parseInt(
        await getSystemSettingWithDefault('chat_message_retry_attempts', '3')
      ),
      sessionTimeout: parseInt(
        await getSystemSettingWithDefault('chat_session_timeout', '3600000')
      ),
    };

    return NextResponse.json({ settings: chatSettings });
  } catch (error) {
    console.error('Error fetching chat settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user has admin privileges (you might want to implement this check)
    // For now, we'll allow any authenticated user to update settings

    const {
      chatEnabled,
      chatApiUrl,
      chatFloatingButton,
      maxFileSize,
      allowedFileTypes,
      typingIndicatorDelay,
      messageRetryAttempts,
      sessionTimeout,
    } = await request.json();

    // Update settings using the global system settings functions
    const updates = [];

    if (chatEnabled !== undefined) {
      updates.push(
        setSystemSetting('chat_enabled', chatEnabled.toString(), {
          description: 'Enable/disable chat functionality',
          category: 'chat',
          user: user.email,
        })
      );
    }

    if (chatApiUrl !== undefined) {
      updates.push(
        setSystemSetting('chat_api_url', chatApiUrl, {
          description: 'Mulesoft chat API endpoint',
          category: 'chat',
          user: user.email,
        })
      );
    }

    if (chatFloatingButton !== undefined) {
      updates.push(
        setSystemSetting(
          'chat_floating_button',
          chatFloatingButton.toString(),
          {
            description: 'Show floating chat button',
            category: 'chat',
            user: user.email,
          }
        )
      );
    }

    if (maxFileSize !== undefined) {
      updates.push(
        setSystemSetting('chat_max_file_size', maxFileSize.toString(), {
          description: 'Maximum file size in bytes',
          category: 'chat',
          user: user.email,
        })
      );
    }

    if (allowedFileTypes !== undefined) {
      updates.push(
        setSystemSetting(
          'chat_allowed_file_types',
          allowedFileTypes.join(','),
          {
            description: 'Allowed file types for chat attachments',
            category: 'chat',
            user: user.email,
          }
        )
      );
    }

    if (typingIndicatorDelay !== undefined) {
      updates.push(
        setSystemSetting(
          'chat_typing_indicator_delay',
          typingIndicatorDelay.toString(),
          {
            description: 'Delay in ms before showing typing indicator',
            category: 'chat',
            user: user.email,
          }
        )
      );
    }

    if (messageRetryAttempts !== undefined) {
      updates.push(
        setSystemSetting(
          'chat_message_retry_attempts',
          messageRetryAttempts.toString(),
          {
            description: 'Number of retry attempts for failed messages',
            category: 'chat',
            user: user.email,
          }
        )
      );
    }

    if (sessionTimeout !== undefined) {
      updates.push(
        setSystemSetting('chat_session_timeout', sessionTimeout.toString(), {
          description: 'Session timeout in ms',
          category: 'chat',
          user: user.email,
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ message: 'Chat settings updated successfully' });
  } catch (error) {
    console.error('Error updating chat settings:', error);
    return NextResponse.json(
      { error: 'Failed to update chat settings' },
      { status: 500 }
    );
  }
}
