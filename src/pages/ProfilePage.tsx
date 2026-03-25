import { useEffect, useState } from 'react';
import { LogOut, Shield, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';

type ProfilePageProps = {
  onLogout: () => void;
};

type MeUser = {
  userId: string;
  username: string;
};

function getInitials(username: string): string {
  if (!username) return '?';
  const parts = username.trim().slice(0, 2).toUpperCase();
  return parts || '?';
}

function getDisplayName(username: string): string {
  if (!username) return '—';
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
}

export function ProfilePage({ onLogout }: ProfilePageProps) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (currentPassword.length < 8 || currentPassword.length > 72) {
      setPasswordError('Current password must be 8-72 characters.');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      setPasswordError('New password must be 8-72 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const res = await authApi.updatePassword(currentPassword, newPassword);
      if (res.updated) {
        setPasswordSuccess('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsPasswordModalOpen(false);
      }
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (isUpdatingPassword) return;
    setIsPasswordModalOpen(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-[#15919B]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account settings</p>
        </header>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </header>

      {/* User Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
        <div className="w-20 h-20 bg-[#E6FAF2] rounded-full flex items-center justify-center text-[#0C6478] text-2xl font-semibold">
          {user ? getInitials(user.username) : '?'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {user ? getDisplayName(user.username) : '—'}
          </h2>
          <p className="text-gray-500">{user ? `@${user.username}` : '—'}</p>
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6FAF2] text-[#0C6478]">
            Pro Member
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-900">Security</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Shield size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-500">Update your account password.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={openPasswordModal}
                className="text-sm text-[#0C6478] font-medium hover:text-[#213A58]"
              >
                Update
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full p-4 bg-white border border-red-200 rounded-xl text-red-600 font-medium hover:bg-red-50 transition-colors flex items-center justify-center shadow-sm">

          <LogOut size={20} className="mr-2" />
          Sign Out
        </button>
      </div>

      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close modal"
            onClick={closePasswordModal}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-500 mt-1">Use at least 8 characters.</p>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleUpdatePassword}>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Current password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#15919B]"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#15919B]"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#15919B]"
                  autoComplete="new-password"
                  required
                />
              </div>

              {passwordError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {passwordError}
                </div>
              ) : null}
              {passwordSuccess ? (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {passwordSuccess}
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={isUpdatingPassword}
                  className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="inline-flex items-center rounded-lg bg-[#0C6478] px-4 py-2 text-sm font-medium text-white hover:bg-[#213A58] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>);

}