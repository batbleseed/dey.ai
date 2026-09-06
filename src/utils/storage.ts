import { ChatSession, WorkspaceSettings, CanvasDocument } from '../types';

const STORAGE_CHATS_KEY = 'dey_workspace_chats_v1';
const STORAGE_SETTINGS_KEY = 'dey_workspace_settings_v1';
const STORAGE_CANVAS_KEY = 'dey_workspace_canvas_v1';

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  systemInstruction:
    'You are Dey, a powerful, thoughtful AI workspace assistant and thinking partner. You provide clear, well-structured, and insightful answers with formatted markdown, code blocks, and thoughtful synthesis. Be accurate, modern, and adaptive to technical or creative requests.',
  theme: 'dark',
  defaultModel: 'gemini-3.8-flash',
  enableWebSearch: false,
  thinkingLevel: 'DEFAULT',
  temperature: 0.7,
  messageBoxWidth: 'wide',
  enableBeta: false,
  customProviders: [],
};

export const INITIAL_CHAT_SESSION: ChatSession = {
  id: 'welcome-session',
  title: 'Welcome to Dey AI Workspace',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isPinned: true,
  model: 'gemini-3.8-flash',
  messages: [
    {
      id: 'welcome-msg-1',
      role: 'assistant',
      content: `# Welcome to Dey AI Workspace ✦

I'm **Dey**, your intelligent AI workspace companion designed with the familiar, fluid ChatGPT experience you love, augmented with powerful workspace tools.

### What you can do here:
- **Instant Conversations**: Ask questions, brainstorm concepts, solve complex math, or synthesize reports.
- **Gemini Thinking Mode**: Toggle deep thinking to inspect chain-of-thought logic before output.
- **Live Search Grounding**: Enable the **Search** toggle to fetch live web sources directly into your responses.
- **Interactive Canvas / Workspace**: Open code snippets and documents in the dedicated **Canvas** panel on the right, edit them live, and test interactive web previews.
- **Multimodal Uploads**: Drag and drop images or documents to analyze charts, mockups, or code.
- **Voice Dictation**: Tap the microphone to dictate your prompts hands-free.

How can I assist your workflow today?`,
      timestamp: Date.now(),
      modelUsed: 'gemini-3.8-flash',
    },
  ],
};

export function loadStoredChats(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_CHATS_KEY);
    if (!raw) return [INITIAL_CHAT_SESSION];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_CHAT_SESSION];
  } catch (e) {
    console.error('Failed to load chats from localStorage:', e);
    return [INITIAL_CHAT_SESSION];
  }
}

export function saveStoredChats(chats: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(chats));
  } catch (e) {
    console.error('Failed to save chats to localStorage:', e);
  }
}

export function loadStoredSettings(): WorkspaceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: WorkspaceSettings): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}

export function loadStoredCanvasDocs(): CanvasDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_CANVAS_KEY);
    if (!raw) {
      return [
        {
          id: 'demo-canvas-1',
          title: 'Dey Quickstart.js',
          language: 'javascript',
          content: `// Dey AI Workspace Canvas
// You can edit, preview, and ask Dey to modify this code.

function welcomeToDey() {
  const features = [
    "ChatGPT-inspired UI with high-density workspace controls",
    "Real-time streaming responses with Gemini 3.8 Flash & Pro",
    "Live deep reasoning mode and web search grounding",
    "Interactive Canvas document & code editor with instant preview",
    "Image & file multimodal analysis"
  ];

  console.log("Ready to build something amazing with Dey!");
  return features;
}

welcomeToDey();`,
          lastModified: Date.now(),
          version: 1,
        },
      ];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveStoredCanvasDocs(docs: CanvasDocument[]): void {
  try {
    localStorage.setItem(STORAGE_CANVAS_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error('Failed to save canvas documents to localStorage:', e);
  }
}
