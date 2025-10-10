'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

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

interface SystemSettingsContextType {
  // Core functions
  getSetting: (key: string) => Promise<string | null>;
  getSettingWithDefault: (key: string, defaultValue: string) => Promise<string>;
  setSetting: (
    key: string,
    value: string,
    options?: SystemSettingOptions
  ) => Promise<boolean>;

  // Advanced functions
  getSettingsByCategory: (
    category: string
  ) => Promise<Array<{ key: string; value: string; description?: string }>>;
  getAllSettings: () => Promise<
    Array<{
      key: string;
      value: string;
      description?: string;
      category: string;
      type: string;
    }>
  >;
  deleteSetting: (key: string) => Promise<boolean>;
  settingExists: (key: string) => Promise<boolean>;

  // Typed functions
  getSettingAsType: <T>(
    key: string,
    type: 'string' | 'number' | 'boolean' | 'json',
    defaultValue: T
  ) => Promise<T>;
  setSettingWithType: (
    key: string,
    value: any,
    type: 'string' | 'number' | 'boolean' | 'json',
    options?: SystemSettingOptions
  ) => Promise<boolean>;

  // Cached settings for performance
  cachedSettings: Map<string, string>;
  refreshCache: () => Promise<void>;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const SystemSettingsContext = createContext<
  SystemSettingsContextType | undefined
>(undefined);

interface SystemSettingsProviderProps {
  children: React.ReactNode;
}

export function SystemSettingsProvider({
  children,
}: SystemSettingsProviderProps) {
  const [cachedSettings, setCachedSettings] = useState<Map<string, string>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh cache by loading all settings
  const refreshCache = useCallback(async () => {
    try {
      const response = await fetch('/loyalty/api/system-settings');
      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      const newCache = new Map<string, string>();

      data.settings?.forEach((setting: any) => {
        newCache.set(setting.key, setting.value);
      });

      setCachedSettings(newCache);
    } catch (err) {
      console.error('Failed to refresh settings cache:', err);
      setError('Failed to refresh settings cache');
    }
  }, []);

  // Initialize settings on mount
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await refreshCache();
      } catch (err) {
        console.error('Failed to initialize system settings:', err);
        setError('Failed to initialize system settings');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();
  }, [refreshCache]);

  // Core functions
  const getSetting = useCallback(
    async (key: string): Promise<string | null> => {
      try {
        setError(null);
        const response = await fetch(`/loyalty/api/system-settings/${key}`);
        if (!response.ok) throw new Error('Failed to fetch setting');

        const data = await response.json();
        const value = data.value;

        // Update cache
        if (value !== null) {
          setCachedSettings(prev => new Map(prev.set(key, value)));
        }

        return value;
      } catch (err) {
        console.error(`Failed to get setting '${key}':`, err);
        setError(`Failed to get setting '${key}'`);
        return null;
      }
    },
    []
  );

  const getSettingWithDefault = useCallback(
    async (key: string, defaultValue: string): Promise<string> => {
      try {
        setError(null);
        const response = await fetch(
          `/loyalty/api/system-settings/${key}?default=${encodeURIComponent(defaultValue)}`
        );
        if (!response.ok) throw new Error('Failed to fetch setting');

        const data = await response.json();
        const value = data.value || defaultValue;

        // Update cache
        setCachedSettings(prev => new Map(prev.set(key, value)));

        return value;
      } catch (err) {
        console.error(`Failed to get setting '${key}' with default:`, err);
        setError(`Failed to get setting '${key}' with default`);
        return defaultValue;
      }
    },
    []
  );

  const setSetting = useCallback(
    async (
      key: string,
      value: string,
      options?: SystemSettingOptions
    ): Promise<boolean> => {
      try {
        setError(null);
        const response = await fetch(`/loyalty/api/system-settings/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value, ...options }),
        });

        if (!response.ok) throw new Error('Failed to set setting');

        // Update cache
        setCachedSettings(prev => new Map(prev.set(key, value)));

        return true;
      } catch (err) {
        console.error(`Failed to set setting '${key}':`, err);
        setError(`Failed to set setting '${key}'`);
        return false;
      }
    },
    []
  );

  // Advanced functions
  const getSettingsByCategory = useCallback(async (category: string) => {
    try {
      setError(null);
      const response = await fetch(`/loyalty/api/system-settings?category=${category}`);
      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      return data.settings || [];
    } catch (err) {
      console.error(`Failed to get settings for category '${category}':`, err);
      setError(`Failed to get settings for category '${category}'`);
      return [];
    }
  }, []);

  const getAllSettings = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/loyalty/api/system-settings');
      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      return data.settings || [];
    } catch (err) {
      console.error('Failed to get all settings:', err);
      setError('Failed to get all settings');
      return [];
    }
  }, []);

  const deleteSetting = useCallback(async (key: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`/loyalty/api/system-settings/${key}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from cache
        setCachedSettings(prev => {
          const newCache = new Map(prev);
          newCache.delete(key);
          return newCache;
        });
        return true;
      }

      return false;
    } catch (err) {
      console.error(`Failed to delete setting '${key}':`, err);
      setError(`Failed to delete setting '${key}'`);
      return false;
    }
  }, []);

  const settingExists = useCallback(async (key: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`/loyalty/api/system-settings/${key}`);
      return response.ok;
    } catch (err) {
      console.error(`Failed to check if setting '${key}' exists:`, err);
      setError(`Failed to check if setting '${key}' exists`);
      return false;
    }
  }, []);

  // Typed functions
  const getSettingAsType = useCallback(async function <T>(
    key: string,
    type: 'string' | 'number' | 'boolean' | 'json',
    defaultValue: T
  ): Promise<T> {
    try {
      setError(null);
      const response = await fetch(`/loyalty/api/system-settings/${key}?type=${type}`);
      if (!response.ok) throw new Error('Failed to fetch setting');

      const data = await response.json();
      return data.value !== undefined ? data.value : defaultValue;
    } catch (err) {
      console.error(`Failed to get setting '${key}' as type '${type}':`, err);
      setError(`Failed to get setting '${key}' as type '${type}'`);
      return defaultValue;
    }
  }, []);

  const setSettingWithType = useCallback(
    async (
      key: string,
      value: any,
      type: 'string' | 'number' | 'boolean' | 'json',
      options?: SystemSettingOptions
    ): Promise<boolean> => {
      try {
        setError(null);
        const response = await fetch(`/loyalty/api/system-settings/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value, type, ...options }),
        });

        if (!response.ok) throw new Error('Failed to set setting');

        // Update cache with string representation
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

        setCachedSettings(prev => new Map(prev.set(key, stringValue)));
        return true;
      } catch (err) {
        console.error(
          `Failed to set setting '${key}' with type '${type}':`,
          err
        );
        setError(`Failed to set setting '${key}' with type '${type}'`);
        return false;
      }
    },
    []
  );

  const value: SystemSettingsContextType = {
    // Core functions
    getSetting,
    getSettingWithDefault,
    setSetting,

    // Advanced functions
    getSettingsByCategory,
    getAllSettings,
    deleteSetting,
    settingExists,

    // Typed functions
    getSettingAsType,
    setSettingWithType,

    // Cached settings
    cachedSettings,
    refreshCache,

    // Loading states
    isLoading,
    error,
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error(
      'useSystemSettings must be used within a SystemSettingsProvider'
    );
  }
  return context;
}

// Convenience hooks for common settings
export function useChatSettings() {
  const { getSettingAsType, setSettingWithType } = useSystemSettings();

  return {
    isEnabled: () => getSettingAsType('chat_enabled', 'boolean', true),
    getApiUrl: () =>
      getSettingAsType(
        'chat_api_url',
        'string',
        'https://your-mulesoft-api.com/chat/v1/messages'
      ),
    isFloatingButtonEnabled: () =>
      getSettingAsType('chat_floating_button', 'boolean', true),
    getMaxFileSize: () =>
      getSettingAsType('chat_max_file_size', 'number', 10485760),
    getAllowedFileTypes: () =>
      getSettingAsType(
        'chat_allowed_file_types',
        'string',
        'image/jpeg,image/png,image/gif,application/pdf,text/plain'
      ),
    getTypingIndicatorDelay: () =>
      getSettingAsType('chat_typing_indicator_delay', 'number', 1000),
    getMessageRetryAttempts: () =>
      getSettingAsType('chat_message_retry_attempts', 'number', 3),
    getSessionTimeout: () =>
      getSettingAsType('chat_session_timeout', 'number', 3600000),

    setEnabled: (enabled: boolean) =>
      setSettingWithType('chat_enabled', enabled, 'boolean'),
    setApiUrl: (url: string) =>
      setSettingWithType('chat_api_url', url, 'string'),
    setFloatingButtonEnabled: (enabled: boolean) =>
      setSettingWithType('chat_floating_button', enabled, 'boolean'),
    setMaxFileSize: (size: number) =>
      setSettingWithType('chat_max_file_size', size, 'number'),
    setAllowedFileTypes: (types: string) =>
      setSettingWithType('chat_allowed_file_types', types, 'string'),
    setTypingIndicatorDelay: (delay: number) =>
      setSettingWithType('chat_typing_indicator_delay', delay, 'number'),
    setMessageRetryAttempts: (attempts: number) =>
      setSettingWithType('chat_message_retry_attempts', attempts, 'number'),
    setSessionTimeout: (timeout: number) =>
      setSettingWithType('chat_session_timeout', timeout, 'number'),
  };
}

export function useLoyaltySettings() {
  const { getSettingAsType, setSettingWithType } = useSystemSettings();

  return {
    getPointsPerDollar: () =>
      getSettingAsType('points_per_dollar', 'number', 1),
    getRedemptionRate: () =>
      getSettingAsType('points_redemption_rate', 'number', 100),

    setPointsPerDollar: (points: number) =>
      setSettingWithType('points_per_dollar', points, 'number'),
    setRedemptionRate: (rate: number) =>
      setSettingWithType('points_redemption_rate', rate, 'number'),
  };
}

export function useGeneralSettings() {
  const { getSettingAsType, setSettingWithType } = useSystemSettings();

  return {
    getCompanyName: () =>
      getSettingAsType('company_name', 'string', 'Customer Loyalty App'),
    getCurrencySymbol: () => getSettingAsType('currency_symbol', 'string', '$'),
    getCurrencyCode: () => getSettingAsType('currency_code', 'string', 'USD'),
    getDateFormat: () =>
      getSettingAsType('date_format', 'string', 'MM/DD/YYYY'),
    getTimeFormat: () => getSettingAsType('time_format', 'string', '12h'),

    setCompanyName: (name: string) =>
      setSettingWithType('company_name', name, 'string'),
    setCurrencySymbol: (symbol: string) =>
      setSettingWithType('currency_symbol', symbol, 'string'),
    setCurrencyCode: (code: string) =>
      setSettingWithType('currency_code', code, 'string'),
    setDateFormat: (format: string) =>
      setSettingWithType('date_format', format, 'string'),
    setTimeFormat: (format: string) =>
      setSettingWithType('time_format', format, 'string'),
  };
}
