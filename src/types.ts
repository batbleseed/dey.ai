export interface Attachment {
  name: string;
  type: string;
  mimeType: string;
  data: string; // base64 string without data prefix (for API) or with (for preview)
  previewUrl?: string;
  size: number;
}

export interface GroundingSource {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  thinking?: string;
  isThinking?: boolean;
  grounding?: GroundingSource[];
  attachment?: Attachment;
  isStreaming?: boolean;
  error?: string;
  modelUsed?: string;
  rating?: 'like' | 'dislike';
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  isPinned?: boolean;
  systemPrompt?: string;
  model?: string;
}

export interface CanvasDocument {
  id: string;
  title: string;
  language: string;
  content: string;
  lastModified: number;
  version: number;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
  recommended?: boolean;
  isCustom?: boolean;
  providerId?: string;
  providerName?: string;
  modelName?: string;
}

export interface CustomProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled: boolean;
  notes?: string;
}

export interface WorkspaceSettings {
  systemInstruction: string;
  theme: 'dark' | 'light' | 'system';
  defaultModel: string;
  enableWebSearch: boolean;
  thinkingLevel: 'DEFAULT' | 'HIGH' | 'LOW';
  temperature?: number;
  messageBoxWidth?: 'wide' | 'full' | 'compact';
  enableBeta?: boolean;
  customProviders?: CustomProvider[];
}
