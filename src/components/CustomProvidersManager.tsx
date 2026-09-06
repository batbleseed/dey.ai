import React, { useState } from 'react';
import {
  Server,
  Plus,
  Trash2,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CustomProvider } from '../types';
import { POPULAR_PROVIDER_PRESETS, createProviderFromPreset } from '../utils/providerPresets';

interface CustomProvidersManagerProps {
  providers: CustomProvider[];
  onChangeProviders: (newProviders: CustomProvider[]) => void;
}

export const CustomProvidersManager: React.FC<CustomProvidersManagerProps> = ({
  providers = [],
  onChangeProviders,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { ok: boolean; message: string; timestamp: number }>
  >({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newModelInputs, setNewModelInputs] = useState<Record<string, string>>({});
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(
    providers.length > 0 ? providers[0].id : null
  );

  const handleAddPreset = (presetName: string) => {
    const preset = POPULAR_PROVIDER_PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    const newProvider = createProviderFromPreset(preset);
    const updated = [...providers, newProvider];
    onChangeProviders(updated);
    setExpandedProviderId(newProvider.id);
  };

  const handleAddCustom = () => {
    const newProvider: CustomProvider = {
      id: `provider-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: 'Custom Provider',
      baseUrl: 'https://api.example.com/v1',
      apiKey: '',
      models: ['custom-model-1'],
      enabled: true,
      notes: 'Custom OpenAI-compatible API endpoint',
    };
    const updated = [...providers, newProvider];
    onChangeProviders(updated);
    setExpandedProviderId(newProvider.id);
  };

  const handleUpdateProvider = (id: string, updates: Partial<CustomProvider>) => {
    const updated = providers.map((p) => (p.id === id ? { ...p, ...updates } : p));
    onChangeProviders(updated);
  };

  const handleDeleteProvider = (id: string) => {
    const updated = providers.filter((p) => p.id !== id);
    onChangeProviders(updated);
  };

  const handleAddModelToProvider = (providerId: string) => {
    const text = (newModelInputs[providerId] || '').trim();
    if (!text) return;
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;

    if (!provider.models.includes(text)) {
      handleUpdateProvider(providerId, { models: [...provider.models, text] });
    }
    setNewModelInputs((prev) => ({ ...prev, [providerId]: '' }));
  };

  const handleRemoveModelFromProvider = (providerId: string, modelName: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;
    handleUpdateProvider(providerId, {
      models: provider.models.filter((m) => m !== modelName),
    });
  };

  const handleTestConnection = async (provider: CustomProvider) => {
    setTestingId(provider.id);
    try {
      const res = await fetch('/api/custom-provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setTestResults((prev) => ({
          ...prev,
          [provider.id]: {
            ok: true,
            message: data.message || 'Successfully connected!',
            timestamp: Date.now(),
          },
        }));

        // If returned models and user wants, populate them
        if (Array.isArray(data.models) && data.models.length > 0) {
          const mergedModels = Array.from(new Set([...provider.models, ...data.models]));
          handleUpdateProvider(provider.id, { models: mergedModels });
        }
      } else {
        setTestResults((prev) => ({
          ...prev,
          [provider.id]: {
            ok: false,
            message: data.error || 'Connection failed',
            timestamp: Date.now(),
          },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider.id]: {
          ok: false,
          message: err?.message || 'Network error reaching server proxy',
          timestamp: Date.now(),
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Overview Banner */}
      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
          <Server className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            OpenAI-Compatible Custom Providers
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
            Connect Dey to self-hosted Ollama, OpenRouter, Groq, DeepSeek, Together AI, or any custom API endpoint. Custom models will automatically appear in your model picker.
          </p>
        </div>
      </div>

      {/* Quick Add Presets Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Quick Add Provider Preset
          </label>
          <button
            type="button"
            onClick={handleAddCustom}
            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Endpoint</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {POPULAR_PROVIDER_PRESETS.map((preset) => {
            const isAlreadyAdded = providers.some(
              (p) => p.name.toLowerCase() === preset.name.toLowerCase()
            );
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleAddPreset(preset.name)}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {preset.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium">
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {preset.notes}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configured Providers Section */}
      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Configured Providers ({providers.length})
          </label>
        </div>

        {providers.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
            <Cpu className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
            <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              No custom providers configured
            </h4>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-sm mx-auto">
              Choose a preset above or add a custom OpenAI-compatible endpoint to chat with alternative models.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((p) => {
              const isExpanded = expandedProviderId === p.id;
              const result = testResults[p.id];
              const isTesting = testingId === p.id;
              const showKey = Boolean(showKeys[p.id]);

              return (
                <div
                  key={p.id}
                  className={`rounded-xl border transition-all ${
                    p.enabled
                      ? 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs'
                      : 'border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-950/40 opacity-70'
                  }`}
                >
                  {/* Provider Header Accordion */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => setExpandedProviderId(isExpanded ? null : p.id)}
                    >
                      <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                        <Layers className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {p.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-mono">
                            {p.models.length} {p.models.length === 1 ? 'model' : 'models'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-neutral-400 truncate mt-0.5">
                          {p.baseUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Enable/Disable switch */}
                      <button
                        type="button"
                        onClick={() => handleUpdateProvider(p.id, { enabled: !p.enabled })}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                          p.enabled
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {p.enabled ? 'Enabled' : 'Disabled'}
                      </button>

                      {/* Expand toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedProviderId(isExpanded ? null : p.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Edit Form */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-4">
                      {/* Name & Base URL */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                            Provider Display Name
                          </label>
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => handleUpdateProvider(p.id, { name: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="e.g. Ollama or Groq"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1">
                            API Base URL (OpenAI-compatible)
                          </label>
                          <input
                            type="text"
                            value={p.baseUrl}
                            onChange={(e) =>
                              handleUpdateProvider(p.id, { baseUrl: e.target.value })
                            }
                            className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="https://api.openai.com/v1"
                          />
                        </div>
                      </div>

                      {/* API Key */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                            API Key (Optional for local Ollama / LM Studio)
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setShowKeys((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                            }
                            className="text-[10px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1 cursor-pointer"
                          >
                            {showKey ? (
                              <>
                                <EyeOff className="w-3 h-3" /> Hide
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" /> Show
                              </>
                            )}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showKey ? 'text' : 'password'}
                            value={p.apiKey || ''}
                            onChange={(e) =>
                              handleUpdateProvider(p.id, { apiKey: e.target.value })
                            }
                            className="w-full px-3 py-1.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="sk-..."
                          />
                        </div>
                      </div>

                      {/* Models List Tag Manager */}
                      <div>
                        <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 block mb-1.5">
                          Available Models (will show in model picker)
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {p.models.map((modelName) => (
                            <span
                              key={modelName}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700/60"
                            >
                              <span>{modelName}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveModelFromProvider(p.id, modelName)}
                                className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add custom model input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newModelInputs[p.id] || ''}
                            onChange={(e) =>
                              setNewModelInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddModelToProvider(p.id);
                              }
                            }}
                            placeholder="Add model name (e.g. llama3.3, deepseek-r1)..."
                            className="flex-1 px-3 py-1 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddModelToProvider(p.id)}
                            className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg text-xs font-medium cursor-pointer"
                          >
                            Add Model
                          </button>
                        </div>
                      </div>

                      {/* Status Feedback Banner */}
                      {result && (
                        <div
                          className={`p-2.5 rounded-lg flex items-center gap-2 text-xs ${
                            result.ok
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                          }`}
                        >
                          {result.ok ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          )}
                          <span className="flex-1">{result.message}</span>
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleTestConnection(p)}
                          disabled={isTesting || !p.baseUrl}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'Testing...' : 'Test & Fetch Models'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProvider(p.id)}
                          className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Provider</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
