import React, { useState, useMemo } from 'react';
import {
  MessageSquarePlus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Code2,
  Compass,
  Cloud,
  LogIn,
  User as UserIcon,
} from 'lucide-react';
import { ChatSession } from '../types';
import { DeyLogo } from './DeyLogo';
import { ProfileDropdown } from './ProfileDropdown';
import type { User } from 'firebase/auth';

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onOpenSettings: () => void;
  onOpenCanvas: () => void;
  enableBeta?: boolean;
  onExportChat: (chat: ChatSession) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentUser?: User | null;
  isCloudSyncing?: boolean;
  onOpenAccountModal: () => void;
  onLoginGoogle?: () => Promise<void>;
  onLogout?: () => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  isOpen,
  onToggleOpen,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  onOpenSettings,
  onOpenCanvas,
  enableBeta = false,
  onExportChat,
  theme,
  onToggleTheme,
  currentUser,
  isCloudSyncing,
  onOpenAccountModal,
  onLoginGoogle,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.messages.some((m) => m.content.toLowerCase().includes(query))
    );
  }, [chats, searchQuery]);

  // Group chats by date
  const groupedChats = useMemo(() => {
    const pinned: ChatSession[] = [];
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const last7Days: ChatSession[] = [];
    const older: ChatSession[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const last7DaysStart = todayStart - 86400000 * 7;

    filteredChats.forEach((chat) => {
      if (chat.isPinned) {
        pinned.push(chat);
      } else if (chat.updatedAt >= todayStart) {
        today.push(chat);
      } else if (chat.updatedAt >= yesterdayStart) {
        yesterday.push(chat);
      } else if (chat.updatedAt >= last7DaysStart) {
        last7Days.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { pinned, today, yesterday, last7Days, older };
  }, [filteredChats]);

  const handleStartRename = (e: React.MouseEvent, chat: ChatSession) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleSaveRename = (e: React.MouseEvent | React.FormEvent, chatId: string) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(null);
  };

  const renderChatGroup = (title: string, groupChats: ChatSession[]) => {
    if (groupChats.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
          {title}
        </div>
        <div className="space-y-0.5">
          {groupChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const isEditing = editingChatId === chat.id;

            return (
              <div
                key={chat.id}
                id={`chat-item-${chat.id}`}
                onClick={() => onSelectChat(chat.id)}
                className={`group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'bg-neutral-200/80 dark:bg-neutral-800/90 font-medium text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                }`}
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => handleSaveRename(e, chat.id)}
                    className="flex items-center gap-1 w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      autoFocus
                      className="w-full bg-white dark:bg-neutral-900 px-2 py-0.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={(e) => handleSaveRename(e, chat.id)}
                      className="p-1 hover:text-emerald-500"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRename}
                      className="p-1 hover:text-red-500"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2 truncate pr-1">
                      {chat.isPinned && (
                        <Pin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      <span className="truncate">{chat.title || 'Untitled conversation'}</span>
                    </div>

                    {/* Action buttons on hover */}
                    <div
                      className={`flex items-center gap-0.5 shrink-0 ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } transition-opacity`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(chat.id);
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        title={chat.isPinned ? 'Unpin chat' : 'Pin chat'}
                      >
                        {chat.isPinned ? (
                          <PinOff className="w-3.5 h-3.5" />
                        ) : (
                          <Pin className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => handleStartRename(e, chat)}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportChat(chat);
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        title="Export"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this conversation?')) {
                            onDeleteChat(chat.id);
                          }
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <div className="hidden md:flex flex-col items-center py-3 px-2 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/90 w-14 shrink-0 justify-between">
        <div className="flex flex-col items-center gap-3">
          <DeyLogo size="xs" />
          <button
            id="sidebar-open-btn"
            onClick={onToggleOpen}
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            title="Expand sidebar (Ctrl+[)"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <button
            id="sidebar-new-chat-mini"
            onClick={onNewChat}
            className="p-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
            title="New Chat"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
          {enableBeta && (
            <button
              onClick={onOpenCanvas}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              title="Dey Canvas (Beta)"
            >
              <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={onOpenAccountModal}
            className="w-8 h-8 rounded-full overflow-hidden hover:opacity-85 transition-opacity cursor-pointer"
            title={currentUser?.displayName || currentUser?.email || 'Profile'}
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                {currentUser?.displayName
                  ? currentUser.displayName.charAt(0).toUpperCase()
                  : currentUser?.email
                  ? currentUser.email.charAt(0).toUpperCase()
                  : 'G'}
              </div>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onToggleOpen}
      />

      <aside
        id="dey-sidebar"
        className="fixed md:static inset-y-0 left-0 z-50 flex flex-col w-56 sm:w-60 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-200 select-none shrink-0 shadow-xl md:shadow-none"
      >
        {/* Header with App Logo and Actions */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-200 dark:border-neutral-800/80">
          <DeyLogo size="sm" showText withBadge />

          <button
            id="sidebar-close-btn"
            onClick={onToggleOpen}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-2.5 pb-2 space-y-1.5">
          <button
            id="sidebar-new-chat-btn"
            onClick={onNewChat}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 font-medium text-sm transition-all shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 shrink-0" />
              <span className="truncate">New Chat</span>
            </div>
            <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-700 dark:bg-neutral-200 text-neutral-300 dark:text-neutral-700 shrink-0">
              Ctrl+N
            </kbd>
          </button>

          {enableBeta && (
            <button
              id="sidebar-canvas-btn"
              onClick={onOpenCanvas}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-colors border border-dashed border-neutral-300 dark:border-neutral-700/80"
            >
              <div className="flex items-center gap-2 truncate">
                <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Canvas</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider shrink-0">
                Beta
              </span>
            </button>
          )}

          {/* Search bar */}
          <div className="relative pt-0.5">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-7 py-1.5 text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Chat List Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-400">
              No conversations found
            </div>
          ) : (
            <>
              {renderChatGroup('Pinned', groupedChats.pinned)}
              {renderChatGroup('Today', groupedChats.today)}
              {renderChatGroup('Yesterday', groupedChats.yesterday)}
              {renderChatGroup('Previous 7 Days', groupedChats.last7Days)}
              {renderChatGroup('Older', groupedChats.older)}
            </>
          )}
        </div>

        {/* Footer Workspace Profile & Controls */}
        <div className="p-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-950/40 relative">
          {/* Profile Dropdown anchored upwards from footer */}
          <ProfileDropdown
            isOpen={isProfileDropdownOpen}
            onClose={() => setIsProfileDropdownOpen(false)}
            currentUser={currentUser}
            theme={theme}
            onToggleTheme={onToggleTheme}
            onOpenProfile={onOpenAccountModal}
            onOpenSettings={onOpenSettings}
            onLoginGoogle={onLoginGoogle}
            onLogout={onLogout}
            placement="top-start"
            className="left-2 right-2 w-auto"
          />

          <div className="flex items-center justify-between gap-2">
            <div
              id="sidebar-user-profile-btn"
              onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity p-1 -m-1 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
              title="Click for Profile, Settings & Theme"
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser?.displayName
                    ? currentUser.displayName.charAt(0).toUpperCase()
                    : currentUser?.email
                    ? currentUser.email.charAt(0).toUpperCase()
                    : 'G'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 truncate">
                  {currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Guest User')}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {!currentUser || currentUser.isAnonymous
                    ? 'Guest · Click for menu'
                    : currentUser.email || 'Connected Account'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
