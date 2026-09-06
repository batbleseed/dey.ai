import React, { useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Settings,
  Sun,
  Moon,
  LogIn,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { User } from 'firebase/auth';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onLoginGoogle?: () => void;
  onLogout?: () => void;
  placement?: 'bottom-end' | 'top-start' | 'top-end';
  className?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  currentUser,
  theme,
  onToggleTheme,
  onOpenProfile,
  onOpenSettings,
  onLoginGoogle,
  onLogout,
  placement = 'bottom-end',
  className = '',
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAnonymous = !currentUser || currentUser.isAnonymous;
  const displayName = currentUser?.displayName
    || (currentUser?.email ? currentUser.email.split('@')[0] : 'Guest');
  const userInitial = (displayName || currentUser?.email || 'U').charAt(0).toUpperCase();

  const placementClasses =
    placement === 'top-start'
      ? 'bottom-full left-0 mb-2'
      : placement === 'top-end'
      ? 'bottom-full right-0 mb-2'
      : 'top-full right-0 mt-2';

  return (
    <div
      ref={dropdownRef}
      id="profile-dropdown-menu"
      className={`absolute ${placementClasses} w-72 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-none ${className}`}
    >
      {/* Account Info Header */}
      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800/80 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-700 object-cover shrink-0 shadow-xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-600/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/30">
              {isAnonymous ? 'G' : userInitial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {displayName}
              </span>
              {!isAnonymous && (
                <span title="Verified Account">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
              {isAnonymous ? 'Guest session · Local' : currentUser?.email || 'Connected Account'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Actions */}
      <div className="space-y-1">
        {/* Profile Item */}
        <button
          type="button"
          id="profile-dropdown-item-profile"
          onClick={() => {
            onClose();
            onOpenProfile();
          }}
          className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-colors">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Profile</div>
              <div className="text-[10px] text-neutral-400 dark:text-neutral-500">Edit display name & photo</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Settings Item */}
        <button
          type="button"
          id="profile-dropdown-item-settings"
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-colors">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Settings</div>
              <div className="text-[10px] text-neutral-400 dark:text-neutral-500">AI model, layout & preferences</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Dark Mode / Light Mode Toggle Item */}
        <button
          type="button"
          id="profile-dropdown-item-theme"
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                theme === 'dark'
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-indigo-500/15 text-indigo-600'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </div>
              <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {theme === 'dark' ? 'Switch to bright interface' : 'Switch to dark interface'}
              </div>
            </div>
          </div>

          {/* Toggle Switch Visual */}
          <div
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
              theme === 'dark' ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
          </div>
        </button>
      </div>

      {/* Footer Auth Action */}
      <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        {isAnonymous ? (
          <button
            type="button"
            id="profile-dropdown-item-login"
            onClick={() => {
              onClose();
              if (onLoginGoogle) {
                onLoginGoogle();
              } else {
                onOpenProfile();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in with Google</span>
          </button>
        ) : (
          <button
            type="button"
            id="profile-dropdown-item-logout"
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors text-xs font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );
};
