import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  KeyRound,
  Trash2,
  Check,
  Moon,
  Sun,
  Bot,
  Globe,
  Gauge,
  RefreshCw,
  Cloud,
  Database,
  LogIn,
  LogOut,
  CheckCircle2,
  Code2,
  FlaskConical,
  Laptop,
  Server,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { WorkspaceSettings } from '../types';
import { DeyLogo } from './DeyLogo';
import { firebaseConfig } from '../lib/firebase';
import type { User } from 'firebase/auth';
import { CustomProvidersManager } from './CustomProvidersManager';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WorkspaceSettings;
  onSaveSettings: (newSettings: WorkspaceSettings) => void;
  onClearAllData: () => void;
  currentUser?: User | null;
  onLoginGoogle?: () => void;
  onLogout?: () => void;
  onManualCloudSync?: () => void;
  isSyncing?: boolean;
  onOpenAccountModal?: () => void;
  initialTab?: 'persona' | 'model' | 'providers' | 'interface' | 'beta' | 'cloud' | 'data';
}

const PRESET_PERSONAS = [
  {
    name: 'Balanced Assistant',
    description: 'Helpful, concise, multi-disciplinary thinking partner',
    prompt:
      'You are Dey, an exceptional, highly capable AI thinking partner and workspace assistant. You write clean, elegant, accurate responses, provide formatted markdown with code snippets, tables, and clear explanations. Be concise, insightful, and adaptable to technical or creative requests.',
  },
  {
    name: 'Senior Architect',
    description: 'Production code, design patterns & edge cases',
    prompt:
      'You are Dey, acting as a Senior Principal Software Architect. Focus on robust, production-grade code, architectural scalability, unit testability, security, and edge-case handling. Always output idiomatic, type-safe code with concise rationale.',
  },
  {
    name: 'Executive Strategist',
    description: 'Sharp, executive-ready memos & strategy briefs',
    prompt:
      'You are Dey, a world-class strategic communications advisor. Write concise, impactful, executive-ready prose with razor-sharp formatting, actionable insights, and bulleted takeaways.',
  },
  {
    name: 'Socratic Tutor',
    description: 'STEM concepts explained from first principles',
    prompt:
      'You are Dey, an engaging STEM researcher and Socratic mentor. Break down complex mathematical and scientific concepts intuitively from first principles, providing illustrative examples and deep conceptual clarity.',
  },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAllData,
  currentUser,
  onLoginGoogle,
  onLogout,
  onManualCloudSync,
  isSyncing,
  onOpenAccountModal,
  initialTab,
}) => {
  const [localSettings, setLocalSettings] = useState<WorkspaceSettings>(settings);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'persona' | 'model' | 'providers' | 'interface' | 'beta' | 'cloud' | 'data'>('persona');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTestKey = async () => {
    const keyToTest = (localSettings.geminiApiKey || '').trim();
    if (!keyToTest) {
      setKeyTestResult({ ok: false, message: 'Please enter a Gemini API key first.' });
      return;
    }
    setIsTestingKey(true);
    setKeyTestResult(null);
    try {
      const res = await fetch('/api/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setKeyTestResult({ ok: true, message: '✓ Key is valid! Connected to Gemini models.' });
      } else {
        setKeyTestResult({ ok: false, message: data.error || 'Failed to validate API key.' });
      }
    } catch (err: any) {
      setKeyTestResult({ ok: false, message: err?.message || 'Network error while testing key.' });
    } finally {
      setIsTestingKey(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/health')
        .then((res) => res.json())
        .then((data) => {
          setHasApiKey(Boolean(data.hasKey));
        })
        .catch(() => setHasApiKey(false));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => {
    const next = { ...localSettings, [key]: value };
    setLocalSettings(next);
    onSaveSettings(next);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  const customProvidersCount = (localSettings.customProviders || []).filter((p) => p.enabled).length;

  const navTabs = [
    { id: 'persona', label: 'Persona', icon: Bot, badge: undefined },
    {
      id: 'model',
      label: 'Models & BYOK',
      icon: Gauge,
      badge: localSettings.geminiApiKey ? 'BYOK' : !hasApiKey ? 'Key Needed' : undefined,
    },
    {
      id: 'providers',
      label: 'Custom Providers',
      icon: Server,
      badge: customProvidersCount > 0 ? String(customProvidersCount) : undefined,
    },
    { id: 'interface', label: 'Display', icon: Moon, badge: undefined },
    { id: 'beta', label: 'Beta Version', icon: FlaskConical, badge: 'Beta' },
    { id: 'cloud', label: 'Cloud Sync', icon: Cloud, badge: undefined },
    { id: 'data', label: 'Storage', icon: Trash2, badge: undefined },
  ] as const;

  return (
    <div
      id="dey-settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="dey-settings-modal"
        className="w-full max-w-4xl h-[90vh] max-h-[760px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header */}
        <div className="h-16 px-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <DeyLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Settings
                </h2>
                {savedSuccess && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in duration-200">
                    Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Workspace, Models & Experimental Preferences
              </p>
            </div>
          </div>

          <button
            id="settings-modal-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close Settings (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Center: Left Sidebar Tabs + Right Content Area */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Tabs Navigation Sidebar */}
          <div className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30 p-2 md:p-3 flex md:flex-col justify-between overflow-x-auto md:overflow-x-visible scrollbar-none">
            <div className="flex md:flex-col gap-1 w-full">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap md:whitespace-normal cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className="ml-2 text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Desktop Gemini Engine Status pill */}
            <div className="hidden md:block pt-3 border-t border-neutral-200 dark:border-neutral-800/80">
              <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 block truncate">
                    Gemini Engine
                  </span>
                  <span className="text-[10px] text-neutral-500 block truncate">
                    {hasApiKey ? 'Online · Connected' : 'Checking status...'}
                  </span>
                </div>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Right Scrollable Content Pane */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm bg-white dark:bg-neutral-900 scrollbar-thin">
            {/* Tab 1: Persona & Custom Instructions */}
            {activeTab === 'persona' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                    Preset Personas
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                    Choose an AI personality and answering style that best fits your workflow:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PRESET_PERSONAS.map((preset, idx) => {
                      const isSelected = localSettings.systemInstruction === preset.prompt;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => updateSetting('systemInstruction', preset.prompt)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/15 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                              {preset.name}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-1 leading-relaxed">
                            {preset.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm">
                      Custom System Prompt
                    </label>
                    <button
                      type="button"
                      onClick={() => updateSetting('systemInstruction', PRESET_PERSONAS[0].prompt)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset to Balanced</span>
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={localSettings.systemInstruction}
                    onChange={(e) => updateSetting('systemInstruction', e.target.value)}
                    placeholder="Define custom behavior, tone, constraints, and instructions for Dey..."
                    className="w-full p-3.5 rounded-xl bg-neutral-50/60 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Models & Parameters */}
            {activeTab === 'model' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Bring Your Own Key (BYOK) Card */}
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          Bring Your Own Key (BYOK)
                        </h4>
                        {localSettings.geminiApiKey ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Personal Key Active
                          </span>
                        ) : hasApiKey ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                            Server key available
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Key needed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Add your personal Gemini API key. Stored locally in your browser so you use your own quota instead of the host.
                      </p>
                    </div>

                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                    >
                      <span>Get free key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="space-y-2">
                    <div className="relative flex items-center">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={localSettings.geminiApiKey || ''}
                        onChange={(e) => {
                          updateSetting('geminiApiKey', e.target.value.trim());
                          setKeyTestResult(null);
                        }}
                        placeholder="Paste your Gemini API key (AIzaSy...)"
                        className="w-full px-3.5 py-2.5 pr-20 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded cursor-pointer transition-colors"
                          title={showApiKey ? 'Hide key' : 'Show key'}
                        >
                          {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {localSettings.geminiApiKey && (
                          <button
                            type="button"
                            onClick={() => {
                              updateSetting('geminiApiKey', undefined);
                              setKeyTestResult(null);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                            title="Clear key"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleTestKey}
                        disabled={isTestingKey || !localSettings.geminiApiKey}
                        className="px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {isTestingKey ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Validating...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Test Key</span>
                          </>
                        )}
                      </button>

                      {keyTestResult && (
                        <p
                          className={`text-xs font-medium flex items-center gap-1 ${
                            keyTestResult.ok
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {keyTestResult.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                    Default Conversation Model
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                    Select which model opens when you start a new conversation:
                  </p>
                  <div className="space-y-2.5">
                    {[
                      {
                        id: 'gemini-3.8-flash',
                        name: 'Gemini 3.8 Flash',
                        badge: 'Fast & Versatile',
                        desc: 'Super-fast response speeds for general reasoning, drafting, synthesis, and daily coding.',
                      },
                      {
                        id: 'gemini-3.8-flash-thinking',
                        name: 'Gemini 3.8 Flash Thinking',
                        badge: 'Thinking Mode',
                        desc: 'Deep multi-step reasoning showing real-time thought chains for algorithms, STEM, and math.',
                      },
                      {
                        id: 'gemini-3.1-pro-preview',
                        name: 'Gemini 3.1 Pro',
                        badge: 'Frontier Pro',
                        desc: 'High-capability frontier model for complex software architecture, deep synthesis, and extensive analysis.',
                      },
                    ].map((m) => {
                      const isSelected = localSettings.defaultModel === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => updateSetting('defaultModel', m.id)}
                          className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/15 dark:bg-emerald-500/10 ring-1 ring-emerald-500/30'
                              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/60 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm">
                              {m.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                                {m.badge}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                            </div>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{m.desc}</p>
                        </button>
                      );
                    })}
                    {/* Enabled Custom Provider Models */}
                    {localSettings.customProviders &&
                      localSettings.customProviders
                        .filter((p) => p.enabled && p.models.length > 0)
                        .map((p) =>
                          p.models.map((modelName) => {
                            const customModelId = `custom:${p.id}:${modelName}`;
                            const isSelected = localSettings.defaultModel === customModelId;
                            return (
                              <button
                                key={customModelId}
                                type="button"
                                onClick={() => updateSetting('defaultModel', customModelId)}
                                className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-emerald-500 bg-emerald-50/15 dark:bg-emerald-500/10 ring-1 ring-emerald-500/30'
                                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/60 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm">
                                      {modelName}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono font-medium">
                                      {p.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                                      Custom
                                    </span>
                                    {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                                  </div>
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">
                                  {p.baseUrl}
                                </p>
                              </button>
                            );
                          })
                        )}
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                        Need other models?
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Connect Ollama, OpenRouter, Groq, or DeepSeek in Custom Providers.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('providers')}
                      className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                    >
                      Configure Providers &rarr;
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm mb-2">
                    Default Search Grounding
                  </h4>
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50/50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <span className="font-medium block text-neutral-900 dark:text-neutral-100 text-xs">
                          Enable Web Grounding by default
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          Search Google automatically to ground responses with fresh live sources
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.enableWebSearch}
                      onChange={(e) => updateSetting('enableWebSearch', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Tab: Custom Providers */}
            {activeTab === 'providers' && (
              <CustomProvidersManager
                providers={localSettings.customProviders || []}
                onChangeProviders={(newProviders) => updateSetting('customProviders', newProviders)}
              />
            )}

            {/* Tab 3: Appearance & Display */}
            {activeTab === 'interface' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                    Workspace Theme
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                    Select your preferred color appearance:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['dark', 'light'] as const).map((t) => {
                      const isSelected = localSettings.theme === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateSetting('theme', t)}
                          className={`flex items-center justify-center gap-2.5 py-3 rounded-xl border text-xs sm:text-sm capitalize transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/15 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500/30'
                              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {t === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                          <span>{t} Mode</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                    Message Box & Reading Width
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                    Adjust how wide chat messages span on wider monitors:
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'wide', label: 'Wide', desc: '1280px Expansive (Default)' },
                      { id: 'full', label: 'Full Width', desc: '100% Screen View' },
                      { id: 'compact', label: 'Compact', desc: '800px Focused' },
                    ].map((item) => {
                      const isSelected = (localSettings.messageBoxWidth || 'wide') === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateSetting('messageBoxWidth', item.id as any)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/15 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500/30'
                              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          <span className="text-xs font-medium">{item.label}</span>
                          <span className="text-[10px] opacity-70 mt-1">{item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Beta Callout in Display */}
                <div className="p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 flex items-center justify-between">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm">
                        Beta Version & Canvas / Scratchpad
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 uppercase">
                        Beta
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      {localSettings.enableBeta
                        ? 'Active: Open Canvas / Scratchpad is visible in sidebar and header.'
                        : 'Currently hidden: Turn on beta version to unlock the Canvas / Scratchpad.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('enableBeta', !localSettings.enableBeta)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      localSettings.enableBeta ? 'bg-purple-600' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                    role="switch"
                    aria-checked={Boolean(localSettings.enableBeta)}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        localSettings.enableBeta ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Beta Version & Experimental Features */}
            {activeTab === 'beta' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Hero Card for Beta */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-emerald-500/5 to-transparent border border-purple-500/20 dark:border-purple-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                        <FlaskConical className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                            Beta Version
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                            Experimental
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-lg leading-relaxed">
                          Turn on Beta version to unlock the interactive <strong>Canvas & Code Scratchpad</strong>, allowing side-by-side editing, live HTML/JS component previews, and quick snippet exports.
                        </p>
                      </div>
                    </div>

                    {/* Master Switch Button */}
                    <button
                      type="button"
                      id="settings-beta-version-toggle"
                      onClick={() => updateSetting('enableBeta', !localSettings.enableBeta)}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localSettings.enableBeta ? 'bg-purple-600' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                      role="switch"
                      aria-checked={Boolean(localSettings.enableBeta)}
                      title={localSettings.enableBeta ? 'Disable Beta Version' : 'Enable Beta Version'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                          localSettings.enableBeta ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Status Indicator */}
                  <div className="pt-3 border-t border-purple-500/15 flex items-center justify-between text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                      Canvas & Scratchpad Availability:
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-1.5 ${
                        localSettings.enableBeta
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-neutral-500'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          localSettings.enableBeta ? 'bg-purple-500 animate-pulse' : 'bg-neutral-400'
                        }`}
                      />
                      {localSettings.enableBeta
                        ? 'UNLOCKED (Visible in sidebar, header, and code snippets)'
                        : 'HIDDEN (Turn on beta toggle above to show)'}
                    </span>
                  </div>
                </div>

                {/* What's in Beta Cards */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-3">
                    Tools & Capabilities in Beta:
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-xl bg-neutral-50/60 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Code2 className="w-4 h-4" />
                        <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                          Side-by-Side Canvas Workspace
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Open a dedicated scratchpad panel alongside your chat to edit multi-page documents, code files, or markdown notes in real time.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-50/60 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                          One-Click Code Import
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Every code block in the chat displays an instant "Canvas" button to jump right into editing and testing snippets.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-50/60 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Laptop className="w-4 h-4" />
                        <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                          Live Interactive Web Previews
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Execute HTML, CSS, and JavaScript widgets inside a safe sandboxed iframe directly inside the Canvas drawer.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-50/60 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Cloud className="w-4 h-4" />
                        <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                          Cloud Document Sync
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        All scratchpad documents and drafts automatically persist to your Firebase Firestore cloud database.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Cloud Sync */}
            {activeTab === 'cloud' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm">
                        Firebase Cloud Firestore
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Your conversations, messages, canvas documents, and preferences back up securely to your Cloud Firestore database in real time.
                  </p>

                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 font-mono text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-400 dark:text-neutral-500">Project:</span>
                      <span className="truncate max-w-[220px]">{firebaseConfig.projectId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 dark:text-neutral-500">Region:</span>
                      <span>asia-southeast1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 dark:text-neutral-500">Database:</span>
                      <span className="truncate max-w-[220px]">
                        {firebaseConfig.firestoreDatabaseId || '(default)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account details */}
                <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm block">
                    Account & Authentication
                  </span>

                  {currentUser ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          {currentUser.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt="Profile"
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full border border-neutral-200 dark:border-neutral-700 shrink-0 object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {currentUser.isAnonymous ? 'G' : currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                              {currentUser.isAnonymous
                                ? 'Cloud Guest Session'
                                : currentUser.displayName || currentUser.email}
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate">
                              {currentUser.email || `UID: ${currentUser.uid.slice(0, 12)}...`}
                            </div>
                          </div>
                        </div>

                        {currentUser.isAnonymous ? (
                          onLoginGoogle && (
                            <button
                              type="button"
                              onClick={onLoginGoogle}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors shrink-0 cursor-pointer"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Sign in</span>
                            </button>
                          )
                        ) : (
                          onLogout && (
                            <button
                              type="button"
                              onClick={onLogout}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors shrink-0 cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Sign Out</span>
                            </button>
                          )
                        )}
                      </div>

                      {onOpenAccountModal && (
                        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenAccountModal();
                            }}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                          >
                            Manage Live Profile, Display Name & Avatar →
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-neutral-500">Initializing Firebase Auth...</div>
                  )}
                </div>

                {/* Force sync */}
                {onManualCloudSync && (
                  <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm block">
                        Force Cloud Synchronization
                      </span>
                      <span className="text-xs text-neutral-500">
                        Upload all local sessions, canvas documents, and settings to Firestore now.
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={onManualCloudSync}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium transition-colors shrink-0 ml-3 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 6: Storage & Danger Zone */}
            {activeTab === 'data' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm block mb-1">
                    Local Storage Architecture
                  </span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Your conversations, custom pinned prompts, and canvas scratchpad documents are cached locally and synchronized with Cloud Firestore.
                  </p>
                </div>

                <div className="pt-2">
                  <label className="block font-semibold text-red-600 dark:text-red-400 mb-2 text-xs sm:text-sm">
                    Danger Zone
                  </label>
                  <div className="p-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-500/5 space-y-3">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Erase all chat history, reset scratchpad documents, and return workspace settings back to initial factory defaults.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to clear all conversations and reset the workspace?')) {
                          onClearAllData();
                          onClose();
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Reset All Conversations & Storage</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="h-16 px-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/40 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Preferences apply and sync automatically</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
