'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Lock,
  Bell,
  Shield,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ImageUpload from '@/components/ui/ImageUpload';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    marketing: false,
  });
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    preferred_contact: 'email',
    marketing_consent: false
  });

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Activity', icon: Shield },
  ];

  // Load customer profile
  useEffect(() => {
    const loadCustomerProfile = async () => {
      // console.log('loadCustomerProfile called, user:', user);
      try {
        const response = await fetch('/loyalty/api/customers/profile');
        // console.log('loadCustomerProfile -> Response: ', response);
        if (response.ok) {
          const data = await response.json();
          console.log('Customer Profile Data: ', data);
          setCustomerProfile(data.customer);
          setProfileImage(data.customer.avatar?.image_data || null);
          setProfileForm({
            first_name: data.customer.first_name || '',
            last_name: data.customer.last_name || '',
            phone: data.customer.phone || '',
            date_of_birth: (data.customer.date_of_birth && data.customer.date_of_birth !== 'null' ? new Date(data.customer.date_of_birth).toISOString().split('T')[0] : '') || '',
            address_line1: data.customer.address_line1 || '',
            address_line2: data.customer.address_line2 || '',
            city: data.customer.city || '',
            state: data.customer.state || '',
            zip_code: data.customer.zip_code || '',
            country: data.customer.country || '',
            preferred_contact: data.customer.preferred_contact || 'email',
            marketing_consent: data.customer.marketing_consent || false
          });
          // console.log('Customer Profile: ', data.customer);
        } else {
          console.error('Failed to load customer profile:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error loading customer profile:', error);
      }
    };

    if (user) {
      console.log('User is available, loading customer profile...');
      loadCustomerProfile();
    } else {
      console.log('User not available yet');
    }
  }, [user]);

  const handleImageUpload = async (imageData: {
    image_data: string;
    filename: string;
    file_size: number;
    width: number;
    height: number;
  }) => {
    if (!customerProfile) return;

    try {
      const response = await fetch(`/loyalty/api/customers/${customerProfile.id}/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageData),
      });

      if (response.ok) {
        setToast({ type: 'success', message: 'Profile picture updated successfully!' });
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setToast({ type: 'error', message: 'Failed to upload profile picture' });
    }
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationToggle = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/loyalty/api/customers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        setToast({ type: 'success', message: 'Profile updated successfully!' });
        // Reload customer profile to get updated data
        const data = await response.json();
        setCustomerProfile(data.customer);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setToast({ type: 'error', message: 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setToast({ type: 'success', message: 'Password changed successfully!' });
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to change password' });
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    try {
      // Simulate data export
      setToast({
        type: 'success',
        message: 'Data export started. You will receive an email when ready.',
      });
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to export data' });
    }
  };

  const deleteAccount = async () => {
    if (
      confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      try {
        // Simulate account deletion
        setToast({
          type: 'success',
          message: 'Account deletion request submitted.',
        });
      } catch (error) {
        setToast({ type: 'error', message: 'Failed to delete account' });
      }
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition-colors',
                        activeTab === tab.id
                          ? 'border border-primary-200 bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'personal' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">
                  Personal Information
                </h2>

                <div className="mb-6 flex items-center space-x-6">
                  <ImageUpload
                    currentImage={profileImage}
                    onImageChange={setProfileImage}
                    onUpload={handleImageUpload}
                    size="lg"
                    disabled={!customerProfile}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Profile Picture
                    </h3>
                    <p className="text-sm text-gray-600">
                      Upload a new profile picture (max 10MB)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => handleFormChange('first_name', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => handleFormChange('last_name', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={profileForm.date_of_birth}
                      onChange={(e) => handleFormChange('date_of_birth', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Preferred Contact
                    </label>
                    <select
                      value={profileForm.preferred_contact}
                      onChange={(e) => handleFormChange('preferred_contact', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Address Information</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={profileForm.address_line1}
                        onChange={(e) => handleFormChange('address_line1', e.target.value)}
                        placeholder="Street address"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={profileForm.address_line2}
                        onChange={(e) => handleFormChange('address_line2', e.target.value)}
                        placeholder="Apartment, suite, etc. (optional)"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        value={profileForm.city}
                        onChange={(e) => handleFormChange('city', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        State/Province
                      </label>
                      <input
                        type="text"
                        value={profileForm.state}
                        onChange={(e) => handleFormChange('state', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        ZIP/Postal Code
                      </label>
                      <input
                        type="text"
                        value={profileForm.zip_code}
                        onChange={(e) => handleFormChange('zip_code', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <input
                        type="text"
                        value={profileForm.country}
                        onChange={(e) => handleFormChange('country', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="marketing_consent"
                      checked={profileForm.marketing_consent}
                      onChange={(e) => handleFormChange('marketing_consent', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="marketing_consent" className="text-sm text-gray-700">
                      I agree to receive marketing communications and promotional offers
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex items-center space-x-2 rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">
                  Security Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={isLoading}
                      className="rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                <div className="mt-12 border-t border-gray-200 pt-8">
                  <h3 className="mb-4 text-lg font-semibold text-red-600">
                    Danger Zone
                  </h3>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-red-800">
                          Delete Account
                        </h4>
                        <p className="mt-1 text-sm text-red-600">
                          Permanently delete your account and all associated
                          data.
                        </p>
                      </div>
                      <button
                        onClick={deleteAccount}
                        className="flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">
                  Notification Preferences
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Email Notifications
                      </h3>
                      <p className="text-sm text-gray-600">
                        Receive updates via email
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('email')}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        notifications.email ? 'bg-primary-600' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          notifications.email
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        SMS Notifications
                      </h3>
                      <p className="text-sm text-gray-600">
                        Receive updates via text message
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('sms')}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        notifications.sms ? 'bg-primary-600' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          notifications.sms ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Push Notifications
                      </h3>
                      <p className="text-sm text-gray-600">
                        Receive push notifications in browser
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('push')}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        notifications.push ? 'bg-primary-600' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          notifications.push ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Marketing Communications
                      </h3>
                      <p className="text-sm text-gray-600">
                        Receive promotional offers and updates
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('marketing')}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        notifications.marketing
                          ? 'bg-primary-600'
                          : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          notifications.marketing
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Data Management
                  </h3>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">
                          Export Your Data
                        </h4>
                        <p className="mt-1 text-sm text-blue-600">
                          Download a copy of your personal data.
                        </p>
                      </div>
                      <button
                        onClick={exportData}
                        className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">
                  Activity Log
                </h2>

                <div className="space-y-4">
                  <div className="py-8 text-center">
                    <Shield className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p className="text-gray-500">No activity logs found</p>
                    <p className="text-sm text-gray-400">
                      Your account activity will appear here
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={cn(
              'flex max-w-sm items-center space-x-3 rounded-lg px-6 py-4 shadow-lg',
              toast.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-800'
                : 'border border-red-200 bg-red-50 text-red-800'
            )}
          >
            {toast.type === 'success' ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
