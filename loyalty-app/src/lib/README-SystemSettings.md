# Global System Settings Functions

This document explains how to use the global system settings functions that provide easy access to system settings from anywhere in the application.

## Overview

The system settings functionality provides a centralized way to manage application configuration through the database. It includes:

- **Global Functions**: Direct access to system settings from any part of the application
- **React Context**: Easy access in React components with caching and state management
- **Type Safety**: TypeScript support with proper typing for different data types
- **API Routes**: RESTful endpoints for managing settings
- **Convenience Hooks**: Specialized hooks for common setting categories

## Core Functions

### Basic Functions

```typescript
import {
  getSystemSetting,
  getSystemSettingWithDefault,
  setSystemSetting,
} from '@/lib/system-settings';

// Get a setting value (returns null if not found)
const value = await getSystemSetting('my_setting');

// Get a setting with a default value
const value = await getSystemSettingWithDefault('my_setting', 'default_value');

// Set a setting value
const success = await setSystemSetting('my_setting', 'my_value', {
  description: 'My custom setting',
  category: 'general',
  user: 'admin',
});
```

### Advanced Functions

```typescript
import {
  getSystemSettingsByCategory,
  getAllSystemSettings,
  deleteSystemSetting,
  systemSettingExists,
  getSystemSettingAsType,
  setSystemSettingWithType,
} from '@/lib/system-settings';

// Get all settings in a category
const chatSettings = await getSystemSettingsByCategory('chat');

// Get all settings
const allSettings = await getAllSystemSettings();

// Check if a setting exists
const exists = await systemSettingExists('my_setting');

// Delete a setting
const deleted = await deleteSystemSetting('my_setting');

// Get setting as specific type
const isEnabled = await getSystemSettingAsType('chat_enabled', 'boolean', true);
const maxSize = await getSystemSettingAsType('max_file_size', 'number', 1024);
const config = await getSystemSettingAsType('app_config', 'json', {});

// Set setting with type validation
await setSystemSettingWithType('chat_enabled', true, 'boolean');
await setSystemSettingWithType('max_file_size', 2048, 'number');
await setSystemSettingWithType('app_config', { theme: 'dark' }, 'json');
```

## React Context Usage

### Basic Context Usage

```typescript
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

function MyComponent() {
  const { getSetting, setSetting, cachedSettings, isLoading, error } = useSystemSettings();

  const handleGetSetting = async () => {
    const value = await getSetting('my_setting');
    console.log('Setting value:', value);
  };

  const handleSetSetting = async () => {
    const success = await setSetting('my_setting', 'new_value');
    if (success) {
      console.log('Setting updated successfully');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleGetSetting}>Get Setting</button>
      <button onClick={handleSetSetting}>Set Setting</button>
      <p>Cached settings: {cachedSettings.size}</p>
    </div>
  );
}
```

### Convenience Hooks

```typescript
import { useChatSettings, useLoyaltySettings, useGeneralSettings } from '@/contexts/SystemSettingsContext';

function SettingsComponent() {
  const chatSettings = useChatSettings();
  const loyaltySettings = useLoyaltySettings();
  const generalSettings = useGeneralSettings();

  const handleToggleChat = async () => {
    const isEnabled = await chatSettings.isEnabled();
    await chatSettings.setEnabled(!isEnabled);
  };

  const handleUpdatePoints = async () => {
    await loyaltySettings.setPointsPerDollar(2);
  };

  const handleUpdateCompany = async () => {
    await generalSettings.setCompanyName('New Company Name');
  };

  return (
    <div>
      <button onClick={handleToggleChat}>Toggle Chat</button>
      <button onClick={handleUpdatePoints}>Update Points</button>
      <button onClick={handleUpdateCompany}>Update Company</button>
    </div>
  );
}
```

## API Routes

### Get All Settings

```bash
GET /api/system-settings
```

### Get Settings by Category

```bash
GET /api/system-settings?category=chat
```

### Get Specific Setting

```bash
GET /api/system-settings/my_setting
GET /api/system-settings/my_setting?type=boolean
GET /api/system-settings/my_setting?default=default_value
```

### Create/Update Setting

```bash
POST /api/system-settings
Content-Type: application/json

{
  "key": "my_setting",
  "value": "my_value",
  "type": "string",
  "description": "My custom setting",
  "category": "general"
}
```

### Update Specific Setting

```bash
PUT /api/system-settings/my_setting
Content-Type: application/json

{
  "value": "new_value",
  "type": "string",
  "description": "Updated description"
}
```

### Delete Setting

```bash
DELETE /api/system-settings/my_setting
```

## Predefined Setting Keys

The system includes predefined constants for common settings:

```typescript
import { SYSTEM_SETTING_KEYS } from '@/lib/system-settings';

// Use predefined keys for type safety
const companyName = await getSystemSetting(SYSTEM_SETTING_KEYS.COMPANY_NAME);
const chatEnabled = await getSystemSetting(SYSTEM_SETTING_KEYS.CHAT_ENABLED);
const pointsPerDollar = await getSystemSetting(
  SYSTEM_SETTING_KEYS.POINTS_PER_DOLLAR
);
```

Available keys:

- `COMPANY_NAME`
- `CURRENCY_SYMBOL`
- `CURRENCY_CODE`
- `DATE_FORMAT`
- `TIME_FORMAT`
- `TAX_INCLUSIVE`
- `DEFAULT_TAX_RATE`
- `POINTS_PER_DOLLAR`
- `POINTS_REDEMPTION_RATE`
- `LOW_STOCK_THRESHOLD`
- `CHAT_ENABLED`
- `CHAT_API_URL`
- `CHAT_FLOATING_BUTTON`
- `CHAT_MAX_FILE_SIZE`
- `CHAT_ALLOWED_FILE_TYPES`
- `CHAT_TYPING_INDICATOR_DELAY`
- `CHAT_MESSAGE_RETRY_ATTEMPTS`
- `CHAT_SESSION_TIMEOUT`

## Setting Categories

Settings are organized into categories:

- **general**: General application settings
- **pos**: Point of sale settings
- **loyalty**: Loyalty program settings
- **inventory**: Inventory management settings
- **email**: Email configuration settings
- **integration**: Third-party integration settings
- **chat**: Chat system settings

## Data Types

The system supports the following data types:

- **string**: Text values
- **number**: Numeric values
- **boolean**: True/false values
- **json**: Complex objects (stored as JSON strings)

## Error Handling

All functions include proper error handling:

```typescript
try {
  const value = await getSystemSetting('my_setting');
  if (value === null) {
    console.log('Setting not found');
  } else {
    console.log('Setting value:', value);
  }
} catch (error) {
  console.error('Error getting setting:', error);
}
```

## Performance Considerations

- **Caching**: The React context includes caching to avoid repeated database calls
- **Batch Operations**: Use `Promise.all()` for multiple operations
- **Type Safety**: Use typed functions to avoid runtime errors
- **Default Values**: Always provide sensible defaults

## Best Practices

1. **Use Predefined Keys**: Use `SYSTEM_SETTING_KEYS` constants for type safety
2. **Provide Defaults**: Always provide default values for settings
3. **Use Appropriate Types**: Use the correct data type for each setting
4. **Handle Errors**: Always handle potential errors gracefully
5. **Cache Results**: Use the React context for client-side caching
6. **Validate Input**: Validate setting values before storing
7. **Document Settings**: Provide clear descriptions for custom settings

## Examples

### Chat Settings Management

```typescript
import { useChatSettings } from '@/contexts/SystemSettingsContext';

function ChatSettingsPanel() {
  const chatSettings = useChatSettings();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const enabled = await chatSettings.isEnabled();
      setIsEnabled(enabled);
    };
    loadSettings();
  }, []);

  const handleToggle = async () => {
    const newValue = !isEnabled;
    await chatSettings.setEnabled(newValue);
    setIsEnabled(newValue);
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={handleToggle}
        />
        Enable Chat
      </label>
    </div>
  );
}
```

### Loyalty Points Configuration

```typescript
import { useLoyaltySettings } from '@/contexts/SystemSettingsContext';

function LoyaltyConfig() {
  const loyaltySettings = useLoyaltySettings();
  const [pointsPerDollar, setPointsPerDollar] = useState(1);

  useEffect(() => {
    const loadSettings = async () => {
      const points = await loyaltySettings.getPointsPerDollar();
      setPointsPerDollar(points);
    };
    loadSettings();
  }, []);

  const handleUpdate = async () => {
    await loyaltySettings.setPointsPerDollar(pointsPerDollar);
    alert('Settings updated successfully!');
  };

  return (
    <div>
      <label>
        Points per Dollar:
        <input
          type="number"
          value={pointsPerDollar}
          onChange={(e) => setPointsPerDollar(Number(e.target.value))}
        />
      </label>
      <button onClick={handleUpdate}>Update</button>
    </div>
  );
}
```

This system provides a robust, type-safe, and performant way to manage application settings throughout your Customer Loyalty App.
