'use client';

import React, { useState } from 'react';
import {
  useSystemSettings,
  useChatSettings,
  useLoyaltySettings,
  useGeneralSettings,
} from '@/contexts/SystemSettingsContext';

/**
 * Example component demonstrating how to use the global system settings functions
 * This component shows various ways to interact with system settings
 */
export default function SystemSettingsExample() {
  const { getSetting, setSetting, cachedSettings, isLoading, error } =
    useSystemSettings();
  const chatSettings = useChatSettings();
  const loyaltySettings = useLoyaltySettings();
  const generalSettings = useGeneralSettings();

  const [newSettingKey, setNewSettingKey] = useState('');
  const [newSettingValue, setNewSettingValue] = useState('');
  const [retrievedValue, setRetrievedValue] = useState<string | null>(null);

  // Example: Get a setting value
  const handleGetSetting = async () => {
    if (!newSettingKey) return;

    const value = await getSetting(newSettingKey);
    setRetrievedValue(value);
  };

  // Example: Set a setting value
  const handleSetSetting = async () => {
    if (!newSettingKey || !newSettingValue) return;

    const success = await setSetting(newSettingKey, newSettingValue, {
      description: 'Example setting',
      category: 'general',
    });

    if (success) {
      alert('Setting saved successfully!');
      setNewSettingKey('');
      setNewSettingValue('');
    } else {
      alert('Failed to save setting');
    }
  };

  // Example: Get chat settings
  const handleGetChatSettings = async () => {
    const isEnabled = await chatSettings.isEnabled();
    const apiUrl = await chatSettings.getApiUrl();
    const maxFileSize = await chatSettings.getMaxFileSize();

    console.log('Chat Settings:', {
      enabled: isEnabled,
      apiUrl,
      maxFileSize,
    });
  };

  // Example: Get loyalty settings
  const handleGetLoyaltySettings = async () => {
    const pointsPerDollar = await loyaltySettings.getPointsPerDollar();
    const redemptionRate = await loyaltySettings.getRedemptionRate();

    console.log('Loyalty Settings:', {
      pointsPerDollar,
      redemptionRate,
    });
  };

  // Example: Get general settings
  const handleGetGeneralSettings = async () => {
    const companyName = await generalSettings.getCompanyName();
    const currencySymbol = await generalSettings.getCurrencySymbol();
    const dateFormat = await generalSettings.getDateFormat();

    console.log('General Settings:', {
      companyName,
      currencySymbol,
      dateFormat,
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-1/4 rounded bg-gray-200"></div>
          <div className="h-4 w-1/2 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-lg bg-white p-6 shadow-md">
      <h2 className="text-2xl font-bold text-gray-900">
        System Settings Example
      </h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {/* Cached Settings Display */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-800">
          Cached Settings ({cachedSettings.size})
        </h3>
        <div className="max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-4">
          {cachedSettings.size === 0 ? (
            <p className="text-gray-500">No settings cached</p>
          ) : (
            <div className="space-y-1">
              {Array.from(cachedSettings.entries()).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="font-mono text-blue-600">{key}:</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Setting Operations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Manual Setting Operations
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Setting Key
            </label>
            <input
              type="text"
              value={newSettingKey}
              onChange={e => setNewSettingKey(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., my_custom_setting"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Setting Value
            </label>
            <input
              type="text"
              value={newSettingValue}
              onChange={e => setNewSettingValue(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., my_value"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleGetSetting}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Get Setting
          </button>

          <button
            onClick={handleSetSetting}
            className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Set Setting
          </button>
        </div>

        {retrievedValue !== null && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              <strong>Retrieved Value:</strong> {retrievedValue || 'null'}
            </p>
          </div>
        )}
      </div>

      {/* Category-specific Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Category-specific Settings
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            onClick={handleGetChatSettings}
            className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Get Chat Settings
          </button>

          <button
            onClick={handleGetLoyaltySettings}
            className="rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            Get Loyalty Settings
          </button>

          <button
            onClick={handleGetGeneralSettings}
            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Get General Settings
          </button>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Usage Examples</h3>

        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 font-medium text-gray-800">Basic Usage:</h4>
          <pre className="overflow-x-auto text-sm text-gray-700">
            {`// Get a setting
const value = await getSetting('my_setting');

// Set a setting
await setSetting('my_setting', 'my_value', {
  description: 'My custom setting',
  category: 'general'
});

// Get with default
const value = await getSettingWithDefault('my_setting', 'default_value');`}
          </pre>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 font-medium text-gray-800">Typed Usage:</h4>
          <pre className="overflow-x-auto text-sm text-gray-700">
            {`// Get as specific type
const isEnabled = await getSettingAsType('chat_enabled', 'boolean', true);
const maxSize = await getSettingAsType('max_file_size', 'number', 1024);

// Set with type
await setSettingWithType('chat_enabled', true, 'boolean');
await setSettingWithType('max_file_size', 2048, 'number');`}
          </pre>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 font-medium text-gray-800">
            Category-specific Hooks:
          </h4>
          <pre className="overflow-x-auto text-sm text-gray-700">
            {`// Use convenience hooks
const chatSettings = useChatSettings();
const isEnabled = await chatSettings.isEnabled();
await chatSettings.setEnabled(true);

const loyaltySettings = useLoyaltySettings();
const pointsPerDollar = await loyaltySettings.getPointsPerDollar();
await loyaltySettings.setPointsPerDollar(2);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
