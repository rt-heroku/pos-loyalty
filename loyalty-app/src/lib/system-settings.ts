import { query } from '@/lib/db';

export interface SystemSettingOptions {
  description?: string;
  category?:
    | 'general'
    | 'pos'
    | 'loyalty'
    | 'inventory'
    | 'email'
    | 'integration'
    | 'chat';
  user?: string;
}

export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    const result = await query('SELECT get_system_setting($1) as value', [key]);
    return result.rows[0]?.value || null;
  } catch (error) {
    console.error(`Error getting system setting '${key}':`, error);
    return null;
  }
}

export async function getSystemSettingWithDefault(
  key: string,
  defaultValue: string
): Promise<string> {
  try {
    const result = await query(
      'SELECT get_system_setting_or_default($1, $2) as value',
      [key, defaultValue]
    );
    return result.rows[0]?.value || defaultValue;
  } catch (error) {
    console.error(`Error getting system setting '${key}' with default:`, error);
    return defaultValue;
  }
}

export async function setSystemSetting(
  key: string,
  value: string,
  options: SystemSettingOptions = {}
): Promise<boolean> {
  try {
    const {
      description = null,
      category = 'general',
      user = 'system',
    } = options;
    const result = await query(
      'SELECT set_system_setting($1, $2, $3, $4, $5) as success',
      [key, value, description, category, user]
    );
    return result.rows[0]?.success || false;
  } catch (error) {
    console.error(`Error setting system setting '${key}':`, error);
    return false;
  }
}

export async function getSystemSettingsByCategory(category: string) {
  try {
    const result = await query(
      `SELECT setting_key as key, setting_value as value, description
       FROM system_settings 
       WHERE category = $1 AND is_active = true
       ORDER BY setting_key`,
      [category]
    );
    return result.rows;
  } catch (error) {
    console.error(
      `Error getting system settings for category '${category}':`,
      error
    );
    return [];
  }
}

export async function getAllSystemSettings() {
  try {
    const result = await query(
      `SELECT setting_key as key, setting_value as value, description, category, setting_type as type
       FROM system_settings 
       WHERE is_active = true
       ORDER BY category, setting_key`
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting all system settings:', error);
    return [];
  }
}

export async function deleteSystemSetting(key: string): Promise<boolean> {
  try {
    const result = await query(
      'UPDATE system_settings SET is_active = false WHERE setting_key = $1',
      [key]
    );
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error(`Error deleting system setting '${key}':`, error);
    return false;
  }
}

export async function systemSettingExists(key: string): Promise<boolean> {
  try {
    const result = await query(
      'SELECT 1 FROM system_settings WHERE setting_key = $1 AND is_active = true LIMIT 1',
      [key]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking if system setting '${key}' exists:`, error);
    return false;
  }
}

export async function getSystemSettingAsType<T>(
  key: string,
  type: 'string' | 'number' | 'boolean' | 'json',
  defaultValue: T
): Promise<T> {
  try {
    const value = await getSystemSetting(key);
    if (value === null) return defaultValue;

    switch (type) {
      case 'string':
        return value as T;
      case 'number':
        return (
          isNaN(parseFloat(value)) ? defaultValue : parseFloat(value)
        ) as T;
      case 'boolean':
        return (value.toLowerCase() === 'true') as T;
      case 'json':
        try {
          return JSON.parse(value) as T;
        } catch {
          return defaultValue;
        }
      default:
        return defaultValue;
    }
  } catch (error) {
    console.error(
      `Error getting system setting '${key}' as type '${type}':`,
      error
    );
    return defaultValue;
  }
}

export async function setSystemSettingWithType(
  key: string,
  value: any,
  type: 'string' | 'number' | 'boolean' | 'json',
  options: SystemSettingOptions = {}
): Promise<boolean> {
  try {
    let stringValue: string;
    switch (type) {
      case 'string':
        stringValue = String(value);
        break;
      case 'number':
        stringValue = String(Number(value));
        break;
      case 'boolean':
        stringValue = String(Boolean(value));
        break;
      case 'json':
        stringValue = JSON.stringify(value);
        break;
      default:
        stringValue = String(value);
    }
    return await setSystemSetting(key, stringValue, {
      ...options,
      description: options.description || `Setting of type ${type}`,
    });
  } catch (error) {
    console.error(
      `Error setting system setting '${key}' with type '${type}':`,
      error
    );
    return false;
  }
}

export async function initializeDefaultSettings(): Promise<void> {
  const defaultSettings = [
    { key: 'company_name', value: 'Customer Loyalty App', category: 'general' },
    { key: 'currency_symbol', value: '$', category: 'general' },
    { key: 'currency_code', value: 'USD', category: 'general' },
    { key: 'chat_enabled', value: 'true', category: 'chat' },
    {
      key: 'chat_api_url',
      value: 'https://your-mulesoft-api.com/chat/v1/messages',
      category: 'chat',
    },
    { key: 'chat_floating_button', value: 'true', category: 'chat' },
    { key: 'points_per_dollar', value: '1', category: 'loyalty' },
    { key: 'points_redemption_rate', value: '100', category: 'loyalty' },
  ];

  for (const setting of defaultSettings) {
    const exists = await systemSettingExists(setting.key);
    if (!exists) {
      await setSystemSetting(setting.key, setting.value, {
        category: setting.category as any,
        description: `Default ${setting.category} setting`,
      });
    }
  }
}
