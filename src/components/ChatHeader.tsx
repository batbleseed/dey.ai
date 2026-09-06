import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Sparkles,
  BrainCircuit,
  Zap,
  Code2,
  Share2,
  RotateCcw,
  Globe,
  Sliders,
  PanelLeft,
  Check,
  Maximize2,
  Shrink,
  LogIn,
  User as UserIcon,
  Server,
  Plus,
} from 'lucide-react';
import { ModelOption, CustomProvider } from '../types';
import { DeyLogo } from './DeyLogo';
import { ProfileDropdown } from './ProfileDropdown';
import type { User } from 'firebase/auth';

interface ChatHeaderProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  isCanvasOpen: boolean;
  onToggleCanvas: () => void;
  enableBeta?: boolean;
  isSettingsOpen?: boolean;
  onToggleSettings?: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  enableThinking: boolean;
  onToggleThinking: () => void;
  onClearChat: () => void;
  onOpenExport: () => void;
  onOpenSettings: (tab?: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  title: string;
  widthMode?: 'wide' | 'full' | 'compact';
  onToggleWidthMode?: () => void;
  currentUser?: User | null;
  onOpenAccountModal?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onLoginGoogle?: () => Promise<void>;
  onLogout?: () => Promise<void>;
  customProviders?: CustomProvider[];
}

const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    description: 'Fast, lightweight & versatile for quick answers, drafting, and coding',
    badge: 'Fast',
    recommended: true,
  },
  {
    id: 'gemini-3.8-flash-thinking',
    name: 'Gemini 3.8 Flash Thinking',
    description: 'Deep chain-of-thought thinking for complex logic, math, and STEM reasoning',
    badge: 'Thinking',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    description: 'High-capability frontier model for software architecture and extensive analysis',
    badge: 'Pro',
  },
];

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedModel,
  onSelectModel,
  isCanvasOpen,
  onToggleCanvas,
  enableBeta = false,
  isSettingsOpen = false,
  enableSearch,
  onToggleSearch,
  enableThinking,
  onToggleThinking,
  onClearChat,
  onOpenExport,
  onOpenSettings,
  isSidebarOpen,
  onToggleSidebar,
  title,
  widthMode = 'wide',
  onToggleWidthMode,
  currentUser,
  onOpenAccountModal,
  theme = 'dark',
  onToggleTheme,
  onLoginGoogle,
  onLogout,
  customProviders = [],
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const customModelOptions: ModelOption[] = (customProviders || [])
    .filter((p) => p.enabled)
    .flatMap((p) =>
      p.models.map((modelName) => ({
        id: `custom:${p.id}:${modelName}`,
        name: modelName,
        description: `${p.name} (${p.baseUrl})`,
        badge: p.name,
        isCustom: true,
        providerId: p.id,
        providerName: p.name,
        modelName,
      }))
    );

  const allModels = [...AVAILABLE_MODELS, ...customModelOptions];
  const currentModel = allModels.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <header
      id="chat-header"
      className="h-14 border-b border-neutral-200 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-3 md:px-4 flex items-center justify-between z-30 select-none sticky top-0"
    >
      <div className="flex items-center gap-2">
        {!isSidebarOpen && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Open sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <DeyLogo size="xs" />
          </div>
        )}

        {/* Model Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="model-selector-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium text-sm text-neutral-900 dark:text-neutral-100"
          >
            <span className="font-semibold truncate max-w-[150px] sm:max-w-[220px]">
              {currentModel.name}
            </span>
            {currentModel.isCustom && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono shrink-0">
                {currentModel.badge}
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0" />
          </button>

          {isDropdownOpen && (
            <div
              id="model-dropdown-menu"
              className="absolute left-0 mt-1 w-80 md:w-96 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] overflow-y-auto"
            >
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/60">
                Gemini Models
              </div>

              <div className="mt-1 space-y-1">
                {AVAILABLE_MODELS.map((m) => {
                  const isSelected = m.id === selectedModel;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectModel(m.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-100 dark:bg-neutral-800/90 text-neutral-900 dark:text-white'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        {m.id.includes('thinking') ? (
                          <BrainCircuit className="w-4 h-4" />
                        ) : m.id.includes('pro') ? (
                          <Sparkles className="w-4 h-4" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{m.name}</span>
                          <div className="flex items-center gap-1.5">
                            {m.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                                {m.badge}
                              </span>
                            )}
                            {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                          {m.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Provider Models Section */}
              {customModelOptions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center justify-between">
                    <span>Custom Provider Models</span>
                    <span className="text-[10px] font-mono text-neutral-400 font-normal">
                      {customModelOptions.length} available
                    </span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {customModelOptions.map((m) => {
                      const isSelected = m.id === selectedModel;
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            onSelectModel(m.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-500/15 dark:bg-purple-500/20 text-purple-950 dark:text-purple-100 ring-1 ring-purple-500/30'
                              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="mt-0.5 p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                            <Server className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-semibold truncate font-mono">
                                {m.name}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                                  {m.badge}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                              </div>
                            </div>
                            <p className="text-[11px] text-neutral-400 font-mono truncate mt-0.5">
                              {m.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Configure Providers Footer Button */}
              <div className="mt-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenSettings('providers');
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Configure Custom Providers (Ollama, Groq, OpenRouter...)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature status badges */}
        <div className="hidden lg:flex items-center gap-1 text-xs">
          <button
            onClick={onToggleSearch}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              enableSearch
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
            }`}
            title="Toggle Web Search Grounding"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
          <button
            onClick={onToggleThinking}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              enableThinking
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
            }`}
            title="Toggle High Reasoning"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Reasoning</span>
          </button>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">
        {/* Toggle Canvas Button (Beta only) */}
        {enableBeta && (
          <button
            id="header-toggle-canvas"
            onClick={onToggleCanvas}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isCanvasOpen
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
            title="Toggle Canvas Workspace"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Canvas</span>
          </button>
        )}

        <button
          id="header-export-btn"
          onClick={onOpenExport}
          className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Export conversation"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          id="header-clear-btn"
          onClick={onClearChat}
          className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Clear current messages"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Toggle Message Box Width Mode */}
        {onToggleWidthMode && (
          <button
            id="header-toggle-width-btn"
            onClick={onToggleWidthMode}
            className={`p-1.5 rounded-lg transition-colors ${
              widthMode === 'full'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={`Message Box Width: ${
              widthMode === 'full' ? 'Full Width (100%)' : widthMode === 'compact' ? 'Compact' : 'Wide (1280px)'
            } - Click to expand / toggle width`}
          >
            {widthMode === 'full' ? (
              <Shrink className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}

        <button
          id="header-settings-btn"
          onClick={() => onOpenSettings()}
          className={`p-1.5 rounded-lg transition-colors ${
            isSettingsOpen
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Workspace Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Live Account Profile Dropdown */}
        <div className="relative">
          <button
            id="header-account-btn"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              !currentUser || currentUser.isAnonymous
                ? 'bg-neutral-100 dark:bg-neutral-800/90 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800/90 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
            }`}
            title="Profile & Workspace Settings"
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  !currentUser || currentUser.isAnonymous
                    ? 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {currentUser?.displayName
                  ? currentUser.displayName.charAt(0).toUpperCase()
                  : currentUser?.email
                  ? currentUser.email.charAt(0).toUpperCase()
                  : <UserIcon className="w-3 h-3" />}
              </div>
            )}
            <span className="max-w-[100px] truncate">
              {!currentUser || currentUser.isAnonymous
                ? 'Guest'
                : currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Profile')}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-150 ${
                isProfileMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <ProfileDropdown
            isOpen={isProfileMenuOpen}
            onClose={() => setIsProfileMenuOpen(false)}
            currentUser={currentUser}
            theme={theme}
            onToggleTheme={onToggleTheme || (() => {})}
            onOpenProfile={onOpenAccountModal || (() => {})}
            onOpenSettings={onOpenSettings}
            onLoginGoogle={onLoginGoogle}
            onLogout={onLogout}
            placement="bottom-end"
          />
        </div>
      </div>
    </header>
  );
};
