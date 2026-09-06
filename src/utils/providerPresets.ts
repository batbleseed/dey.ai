import { CustomProvider } from '../types';

export interface ProviderPreset {
  name: string;
  baseUrl: string;
  defaultModels: string[];
  placeholderKey?: string;
  keyHelpUrl?: string;
  notes: string;
  badge: string;
}

export const POPULAR_PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModels: [
      'deepseek/deepseek-r1',
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-001',
    ],
    placeholderKey: 'sk-or-v1-...',
    keyHelpUrl: 'https://openrouter.ai/keys',
    notes: 'Access hundreds of open and frontier AI models via a single unified API key.',
    badge: 'Popular',
  },
  {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModels: [
      'llama-3.3-70b-versatile',
      'deepseek-r1-distill-llama-70b',
      'mixtral-8x7b-32768',
    ],
    placeholderKey: 'gsk_...',
    keyHelpUrl: 'https://console.groq.com/keys',
    notes: 'Ultra-high speed LPU inference for Llama, Mixtral, and DeepSeek models.',
    badge: 'Ultra Fast',
  },
  {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModels: ['deepseek-chat', 'deepseek-reasoner'],
    placeholderKey: 'sk-...',
    keyHelpUrl: 'https://platform.deepseek.com/api_keys',
    notes: 'Official DeepSeek API with native DeepSeek-V3 chat and DeepSeek-R1 reasoning.',
    badge: 'Reasoning',
  },
  {
    name: 'Ollama (Local / Remote)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModels: ['llama3.2', 'deepseek-r1', 'qwen2.5-coder', 'mistral'],
    placeholderKey: 'Not required for local',
    notes: 'Connect to your local or self-hosted Ollama server running locally or on a private network.',
    badge: 'Local / Offline',
  },
  {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModels: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'deepseek-ai/DeepSeek-R1',
      'Qwen/Qwen2.5-Coder-32B-Instruct',
    ],
    placeholderKey: 'tog_...',
    keyHelpUrl: 'https://api.together.ai/settings/api-keys',
    notes: 'High performance open-source model hosting with dedicated throughput.',
    badge: 'Cloud',
  },
  {
    name: 'LM Studio / LocalAI',
    baseUrl: 'http://localhost:1234/v1',
    defaultModels: ['local-model'],
    placeholderKey: 'Not required for local',
    notes: 'Connect to LM Studio Local Server or LocalAI running with OpenAI-compatible API.',
    badge: 'Local',
  },
];

export function createProviderFromPreset(preset: ProviderPreset): CustomProvider {
  return {
    id: `provider-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: preset.name,
    baseUrl: preset.baseUrl,
    apiKey: '',
    models: [...preset.defaultModels],
    enabled: true,
    notes: preset.notes,
  };
}
