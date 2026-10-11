import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import { Shield, Trash2, LogOut, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    try {
      setDeleting(true);
      await api.deleteAccount();
      window.location.href = '/login';
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 py-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-nordic-charcoal dark:text-nordic-dark-text">
          Account Settings
        </h1>
        <p className="text-sm text-nordic-slate">
          Manage your personal details and connected authentication providers.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-nordic-charcoal dark:text-nordic-dark-text">Profile Information</h2>

        <div className="flex items-center space-x-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User Avatar'}
              className="w-16 h-16 rounded-full border border-nordic-border dark:border-nordic-dark-border object-cover shadow-xs"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-nordic-pine text-white flex items-center justify-center text-xl font-bold">
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
          )}

          <div>
            <div className="text-lg font-bold text-nordic-charcoal dark:text-nordic-dark-text">
              {user.name || 'NordLink User'}
            </div>
            <div className="text-sm text-nordic-slate flex items-center space-x-1.5 mt-0.5">
              <span>{user.email || 'No email attached'}</span>
              {user.emailVerified && (
                <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-nordic-border dark:border-nordic-dark-border">
          <div className="text-xs font-semibold uppercase tracking-wider text-nordic-slate mb-3">
            Connected OAuth Providers
          </div>
          <div className="flex flex-wrap gap-2.5">
            {user.providers && user.providers.length > 0 ? (
              user.providers.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-nordic-border dark:border-nordic-dark-border bg-nordic-bg dark:bg-nordic-dark-bg text-xs font-semibold capitalize text-nordic-charcoal dark:text-nordic-dark-text"
                >
                  <Shield className="w-3.5 h-3.5 text-nordic-pine dark:text-nordic-sage" />
                  <span>{p}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-nordic-slate">Default authentication provider</span>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-start">
          <button
            onClick={logout}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-nordic-border dark:border-nordic-dark-border hover:bg-nordic-mist/40 dark:hover:bg-nordic-dark-border text-nordic-charcoal dark:text-nordic-dark-text transition-colors"
          >
            <LogOut className="w-4 h-4 text-nordic-slate" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <h2 className="text-base font-bold">Danger Zone</h2>
        </div>
        <p className="text-xs text-rose-700 dark:text-rose-300/80 leading-relaxed max-w-xl">
          Permanently delete your account, all created short links, and associated click analytics.
          Once confirmed, this operation cannot be reversed.
        </p>

        <button
          onClick={() => setDeleteModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-xs active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Account</span>
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Account Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-nordic-slate leading-relaxed">
            This will permanently remove your user profile, all short links registered under your account,
            and all click analytics history from our database.
          </p>

          <div>
            <label htmlFor="confirm-delete-input" className="block text-xs font-semibold text-nordic-charcoal dark:text-nordic-dark-text mb-1">
              Type <strong className="text-rose-600">DELETE</strong> to confirm:
            </label>
            <input
              id="confirm-delete-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 rounded-xl border border-nordic-border dark:border-nordic-dark-border bg-nordic-bg dark:bg-nordic-dark-bg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-nordic-border dark:border-nordic-dark-border"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={confirmText !== 'DELETE' || deleting}
              onClick={handleDeleteAccount}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-40 flex items-center space-x-1.5"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{deleting ? 'Deleting...' : 'Permanently Delete'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
