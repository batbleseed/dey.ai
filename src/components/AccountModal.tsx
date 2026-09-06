import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  LogOut,
  LogIn,
  Check,
  Sparkles,
  ShieldCheck,
  Copy,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  onLoginGoogle: () => Promise<void>;
  onLogout: () => Promise<void>;
  onUpdateProfile: (name: string, photoURL?: string) => Promise<void>;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginGoogle,
  onLogout,
  onUpdateProfile,
}) => {
  const isAnonymous = !currentUser || currentUser.isAnonymous;
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Guest User'));
      setSelectedAvatar(currentUser.photoURL || '');
    } else {
      setDisplayName('Guest User');
      setSelectedAvatar('');
    }
    setSuccessMsg('');
    setErrorMsg('');
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Display name cannot be empty');
      return;
    }
    setIsSaving(true);
    setErrorMsg('');
    try {
      await onUpdateProfile(displayName.trim(), selectedAvatar || undefined);
      setSuccessMsg('Live profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg('');
    try {
      await onLoginGoogle();
      setSuccessMsg('Signed in successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await onLogout();
      setSuccessMsg('Signed out');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Logout failed');
    }
  };

  const handleCopyUid = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const userInitial = (displayName || currentUser?.email || 'U').charAt(0).toUpperCase();

  return (
    <div
      id="account-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="account-modal-container"
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Live Account Profile
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Manage your credentials and live workspace profile
              </p>
            </div>
          </div>
          <button
            id="account-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl flex items-center gap-2 animate-in fade-in">
              <X className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Live Profile Header Card */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-4">
            <div className="relative group">
              {selectedAvatar ? (
                <img
                  src={selectedAvatar}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500/40 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                  {userInitial}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-xs border-2 border-white dark:border-neutral-900">
                <Check className="w-3 h-3" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {displayName || 'Guest User'}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {isAnonymous ? 'Guest' : 'Live Profile'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                {currentUser?.email || 'Local workspace session'}
              </p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isAnonymous ? 'Unsaved across devices' : 'Connected to Firebase'}</span>
              </p>
            </div>
          </div>

          {/* Google Sign In Callout (If Anonymous) */}
          {isAnonymous && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Sign In with your Account
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Log in with Google to sync all your chats, custom instructions, and canvas documents across all your devices automatically.
                  </p>
                </div>
              </div>

              <button
                id="modal-google-login-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium text-sm border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-all shadow-xs disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* Edit Live Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label
                htmlFor="account-display-name-input"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5"
              >
                Live Profile Name
              </label>
              <div className="relative">
                <input
                  id="account-display-name-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 pr-10"
                />
                <Edit3 className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                This live name appears in your sidebar, messages, and document headers.
              </p>
            </div>

            {/* Quick Avatar Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Choose Avatar
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedAvatar('')}
                  className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center border-2 transition-all ${
                    !selectedAvatar
                      ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                      : 'border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                  title="Default Initials"
                >
                  {userInitial}
                </button>
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                      selectedAvatar === url
                        ? 'border-emerald-500 scale-105 shadow-xs'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <button
              id="account-save-profile-btn"
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Save Live Profile</span>
            </button>
          </form>

          {/* Account Details & Metadata */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">Account ID</span>
              <button
                type="button"
                onClick={handleCopyUid}
                className="flex items-center gap-1 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="Copy User ID"
              >
                <span>{currentUser?.uid ? `${currentUser.uid.slice(0, 10)}...` : 'Local'}</span>
                {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">Status</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {isAnonymous ? 'Guest Workspace' : 'Authenticated User'}
              </span>
            </div>
          </div>

          {/* Sign Out / Switch Account (If Logged in) */}
          {!isAnonymous && (
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <button
                id="account-logout-btn"
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 py-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
              <button
                id="account-switch-btn"
                type="button"
                onClick={handleGoogleLogin}
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 py-1.5 transition-colors"
              >
                Switch Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
