import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Email Change
  const [newEmail, setNewEmail] = useState('');

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: user?.privacySettings?.profileVisibility || 'public',
    showEmail: user?.privacySettings?.showEmail !== false,
    showProjects: user?.privacySettings?.showProjects !== false
  });

  // Notification Preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: user?.notificationPrefs?.emailNotifications !== false,
    collaborationRequests: user?.notificationPrefs?.collaborationRequests !== false,
    projectUpdates: user?.notificationPrefs?.projectUpdates !== false,
    eventReminders: user?.notificationPrefs?.eventReminders !== false,
    weeklyDigest: user?.notificationPrefs?.weeklyDigest || false,
    comments: user?.notificationPrefs?.comments !== false,
    mentions: user?.notificationPrefs?.mentions !== false,
    newFollowers: user?.notificationPrefs?.newFollowers !== false
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/updatepassword', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    
    if (!newEmail || newEmail === user.email) {
      toast.error('Please enter a new email address');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, { email: newEmail });
      toast.success('Email updated successfully! Please verify your new email.');
      setNewEmail('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, { privacySettings });
      toast.success('Privacy settings updated');
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPrefsUpdate = async () => {
    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, { notificationPrefs });
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Type "DELETE" to confirm account deletion:'
    );

    if (doubleConfirm !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-h-screen py-8">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-dark mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <div className="card">
              <div className="card-body p-2">
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full text-left px-4 py-3 rounded-card flex items-center gap-3 ${
                    activeTab === 'account'
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <i className="bi bi-person-circle"></i>
                  Account
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-3 rounded-card flex items-center gap-3 ${
                    activeTab === 'security'
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <i className="bi bi-shield-lock"></i>
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full text-left px-4 py-3 rounded-card flex items-center gap-3 ${
                    activeTab === 'privacy'
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <i className="bi bi-eye"></i>
                  Privacy
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full text-left px-4 py-3 rounded-card flex items-center gap-3 ${
                    activeTab === 'notifications'
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <i className="bi bi-bell"></i>
                  Notifications
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold">Account Settings</h2>
                </div>
                <div className="card-body space-y-6">
                  {/* Email Change */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Change Email</h3>
                    <form onSubmit={handleEmailChange}>
                      <div className="form-group">
                        <label className="form-label">Current Email</label>
                        <input
                          type="email"
                          value={user?.email}
                          disabled
                          className="form-control bg-gray-100"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">New Email</label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="form-control"
                          placeholder="Enter new email address"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !newEmail}
                        className="btn btn-primary"
                      >
                        Update Email
                      </button>
                    </form>
                  </div>

                  <hr />

                  {/* Delete Account */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-danger">Danger Zone</h3>
                    <p className="text-gray-600 mb-3">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="btn bg-danger text-white hover:bg-red-700"
                    >
                      <i className="bi bi-trash mr-2"></i>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold">Security Settings</h2>
                </div>
                <div className="card-body">
                  <h3 className="text-lg font-semibold mb-3">Change Password</h3>
                  <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="form-control"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className="form-control"
                        required
                      />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary">
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold">Privacy Settings</h2>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label className="form-label">Profile Visibility</label>
                    <select
                      value={privacySettings.profileVisibility}
                      onChange={(e) =>
                        setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })
                      }
                      className="form-control"
                    >
                      <option value="public">Public - Anyone can view</option>
                      <option value="registered">Registered Users Only</option>
                      <option value="private">Private - Only me</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-semibold">Show Email Address</h4>
                      <p className="text-sm text-gray-600">Display your email on your profile</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.showEmail}
                        onChange={(e) =>
                          setPrivacySettings({ ...privacySettings, showEmail: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-semibold">Show My Projects</h4>
                      <p className="text-sm text-gray-600">Allow others to see your research projects</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.showProjects}
                        onChange={(e) =>
                          setPrivacySettings({ ...privacySettings, showProjects: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <button
                    onClick={handlePrivacyUpdate}
                    disabled={loading}
                    className="btn btn-primary mt-4"
                  >
                    Save Privacy Settings
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold">Notification Preferences</h2>
                </div>
                <div className="card-body space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-semibold">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailNotifications}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            emailNotifications: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-semibold">Collaboration Requests</h4>
                      <p className="text-sm text-gray-600">Get notified about collaboration invites</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.collaborationRequests}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            collaborationRequests: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-semibold">Project Updates</h4>
                      <p className="text-sm text-gray-600">Notifications about your projects</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.projectUpdates}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            projectUpdates: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-semibold">Event Reminders</h4>
                      <p className="text-sm text-gray-600">Reminders for registered events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.eventReminders}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            eventReminders: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-semibold">Weekly Digest</h4>
                      <p className="text-sm text-gray-600">Get a weekly summary of platform activity</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.weeklyDigest}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            weeklyDigest: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-semibold">Comments & Replies</h4>
                      <p className="text-sm text-gray-600">When someone comments on your projects</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.comments}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            comments: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-semibold">Mentions</h4>
                      <p className="text-sm text-gray-600">When someone mentions you in a post or comment</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.mentions}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            mentions: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-semibold">New Followers</h4>
                      <p className="text-sm text-gray-600">When someone starts following your research</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.newFollowers}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            newFollowers: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <button
                    onClick={handleNotificationPrefsUpdate}
                    disabled={loading}
                    className="btn btn-primary mt-4"
                  >
                    Save Notification Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
