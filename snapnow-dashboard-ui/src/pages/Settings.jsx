import { useState, useEffect } from 'react';
import { Shield, Database, Bell, Users as UsersIcon, Save, RotateCcw, Loader2 } from 'lucide-react';
import settingsService from '../services/settingsService';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'SnapNow',
    allowRegistration: true,
    requireEmailVerification: false,
    enableNotifications: true,
    autoModeration: false,
    maxFileSize: 5,
    allowedFileTypes: 'image/jpeg, image/png, image/gif',
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.getSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings. Using default values.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await settingsService.updateSettings(settings);
      if (response.success) {
        setSaved(true);
        setSettings(response.data);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default values?')) {
      return;
    }

    try {
      setResetting(true);
      setError(null);
      const response = await settingsService.resetSettings();
      if (response.success) {
        setSettings(response.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError('Failed to reset settings. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your dashboard and application</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            disabled={resetting || saving}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving || resetting}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✓ Settings saved successfully!
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            General Settings
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Allow User Registration</p>
              <p className="text-sm text-gray-500">Allow new users to sign up</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) => handleChange('allowRegistration', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Require Email Verification</p>
              <p className="text-sm text-gray-500">Users must verify email before posting</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Content Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Content Settings
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max File Size (MB)
            </label>
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => handleChange('maxFileSize', Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              min="1"
              max="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed File Types
            </label>
            <input
              type="text"
              value={settings.allowedFileTypes}
              onChange={(e) => handleChange('allowedFileTypes', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="image/jpeg, image/png, image/gif"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated MIME types</p>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Auto Moderation</p>
              <p className="text-sm text-gray-500">Automatically flag inappropriate content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoModeration}
                onChange={(e) => handleChange('autoModeration', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-600" />
            Notification Settings
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Enable Notifications</p>
              <p className="text-sm text-gray-500">Receive admin notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Admin Users */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-green-600" />
            Admin Users
          </h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">Manage admin users and permissions (Coming soon)</p>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed">
            Add Admin User
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleReset}
          disabled={resetting || saving}
          className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RotateCcw className="w-5 h-5" />
          )}
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={saving || resetting}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save All Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
