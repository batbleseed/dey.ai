import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Lazy initialization of Gemini client
let defaultAiClient: GoogleGenAI | null = null;
function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const trimmed = (customApiKey || '').trim();
  if (trimmed) {
    return new GoogleGenAI({
      apiKey: trimmed,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  if (!defaultAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    defaultAiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return defaultAiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    serverHasKey: Boolean(process.env.GEMINI_API_KEY),
    workspace: 'Dey AI Workspace',
  });
});

// Test Gemini API key (BYOK validation)
app.post('/api/gemini/test', async (req, res) => {
  try {
    const apiKey = (req.body.apiKey || process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(400).json({ ok: false, error: 'No API key provided to test' });
    }
    const testAi = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    const result = await testAi.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Ping',
    });
    if (result.text !== undefined) {
      return res.json({ ok: true, message: 'Valid Gemini API Key!' });
    }
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('Gemini Key Test Error:', err);
    return res.status(400).json({
      ok: false,
      error: err?.message || 'Invalid Gemini API key or failed to connect to Gemini API',
    });
  }
});

// Models list endpoint
app.get('/api/models', (req, res) => {
  res.json({
    models: [
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        description: 'Fast, intelligent, and versatile for everyday work and brainstorming',
        badge: 'Default',
        recommended: true,
      },
      {
        id: 'gemini-3.8-flash-thinking',
        actualModel: 'gemini-3.8-flash',
        thinking: true,
        name: 'Gemini 3.8 Flash Thinking',
        description: 'Deep chain-of-thought reasoning for complex problem-solving and logic',
        badge: 'Thinking',
      },
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro',
        description: 'Advanced reasoning, high-complexity code, math, and STEM architecture',
        badge: 'Pro',
      },
    ],
  });
});

// Test custom provider connection and list available models
app.post('/api/custom-provider/test', async (req, res) => {
  try {
    const { baseUrl, apiKey } = req.body;
    if (!baseUrl) {
      return res.status(400).json({ ok: false, error: 'Base URL is required' });
    }

    let endpoint = baseUrl.trim().replace(/\/$/, '');
    if (endpoint.endsWith('/chat/completions')) {
      endpoint = endpoint.replace(/\/chat\/completions$/, '');
    }
    const modelsEndpoint = `${endpoint}/models`;

    const headers: Record<string, string> = {
      'User-Agent': 'Dey-Workspace/1.0',
    };
    if (apiKey && apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const response = await fetch(modelsEndpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        ok: false,
        error: `Provider HTTP ${response.status}: ${errText.slice(0, 250)}`,
      });
    }

    const data = (await response.json()) as any;
    let modelNames: string[] = [];
    if (Array.isArray(data.data)) {
      modelNames = data.data.map((m: any) => m.id || m.name).filter(Boolean);
    } else if (Array.isArray(data.models)) {
      modelNames = data.models.map((m: any) => m.id || m.name).filter(Boolean);
    }

    return res.json({
      ok: true,
      models: modelNames.slice(0, 60),
      message: `Connection successful! ${modelNames.length > 0 ? `Found ${modelNames.length} models.` : 'Ready to use.'}`,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to reach custom provider endpoint',
    });
  }
});

// Chat completion streaming endpoint (SSE)
app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const {
      messages = [],
      model = 'gemini-3.8-flash',
      systemInstruction = '',
      enableSearch = false,
      thinkingLevel,
      attachment,
      customProvider,
    } = req.body;

    // Handle Custom Provider (OpenAI compatible)
    if (customProvider && customProvider.baseUrl) {
      let endpoint = customProvider.baseUrl.trim().replace(/\/$/, '');
      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = `${endpoint}/chat/completions`;
      }

      const formattedMessages: any[] = [];
      if (systemInstruction) {
        formattedMessages.push({
          role: 'system',
          content: systemInstruction,
        });
      }

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const role =
          msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user';

        if (
          i === messages.length - 1 &&
          role === 'user' &&
          attachment &&
          attachment.data &&
          attachment.mimeType
        ) {
          if (attachment.mimeType.startsWith('image/')) {
            formattedMessages.push({
              role: 'user',
              content: [
                { type: 'text', text: msg.content || 'Please analyze this image' },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${attachment.mimeType};base64,${attachment.data}`,
                  },
                },
              ],
            });
          } else {
            formattedMessages.push({
              role: 'user',
              content: `${msg.content}\n\n[Attached File: ${attachment.name || 'document'}]`,
            });
          }
        } else {
          formattedMessages.push({
            role,
            content: msg.content || '',
          });
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Dey-Workspace/1.0',
      };
      if (customProvider.apiKey && customProvider.apiKey.trim()) {
        headers['Authorization'] = `Bearer ${customProvider.apiKey.trim()}`;
      }

      const chosenModel = customProvider.model || 'default';

      let providerRes: Response;
      try {
        providerRes = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: chosenModel,
            messages: formattedMessages,
            stream: true,
          }),
        });
      } catch (fetchErr: any) {
        res.write(
          `data: ${JSON.stringify({
            error: `Failed to connect to custom provider at ${customProvider.baseUrl}: ${fetchErr?.message || 'Network error'}`,
          })}\n\n`
        );
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      if (!providerRes.ok) {
        const errText = await providerRes.text();
        let parsedErr = errText;
        try {
          const parsed = JSON.parse(errText);
          parsedErr = parsed.error?.message || parsed.message || errText;
        } catch {}
        res.write(
          `data: ${JSON.stringify({
            error: `[${customProvider.providerName || 'Custom Provider'} HTTP ${providerRes.status}]: ${parsedErr}`,
          })}\n\n`
        );
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      const reader = providerRes.body?.getReader();
      if (!reader) {
        res.write(
          `data: ${JSON.stringify({
            error: 'Custom provider returned an empty body stream',
          })}\n\n`
        );
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let isReasoningOpen = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.replace(/^data: /, '').trim();
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta;
            if (!delta) continue;

            // Handle DeepSeek-R1 reasoning tokens
            if (delta.reasoning_content) {
              if (!isReasoningOpen) {
                res.write(`data: ${JSON.stringify({ text: '> *Thinking...*\n> ' })}\n\n`);
                isReasoningOpen = true;
              }
              const formattedReasoning = delta.reasoning_content.replace(/\n/g, '\n> ');
              res.write(`data: ${JSON.stringify({ text: formattedReasoning })}\n\n`);
            }

            const textChunk = delta.content || delta.text || '';
            if (textChunk) {
              if (isReasoningOpen) {
                res.write(`data: ${JSON.stringify({ text: '\n\n---\n\n' })}\n\n`);
                isReasoningOpen = false;
              }
              res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
            }
          } catch {
            // Ignore parse errors on individual SSE chunks
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const userProvidedKey = (req.body.geminiApiKey || req.headers['x-gemini-api-key'] || '').trim();
    const apiKey = userProvidedKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.write(
        `data: ${JSON.stringify({
          error:
            'No Gemini API key found. Please provide your Google AI Studio API key in Settings > Models (BYOK) to chat.',
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const ai = getGeminiClient(apiKey);

    // Map model selection
    let selectedModel = model;
    let selectedThinkingLevel: ThinkingLevel | undefined;

    if (model === 'gemini-3.8-flash-thinking') {
      selectedModel = 'gemini-3.8-flash';
      selectedThinkingLevel = ThinkingLevel.HIGH;
    } else if (thinkingLevel === 'HIGH') {
      selectedThinkingLevel = ThinkingLevel.HIGH;
    } else if (thinkingLevel === 'LOW') {
      selectedThinkingLevel = ThinkingLevel.LOW;
    }

    // Build contents from messages
    // Format messages for gemini contents
    const contents: any[] = [];

    // All previous turns
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = msg.role === 'user' ? 'user' : 'model';

      // If it's the latest user message and has attachment
      if (i === messages.length - 1 && role === 'user' && attachment && attachment.data && attachment.mimeType) {
        contents.push({
          role: 'user',
          parts: [
            {
              inlineData: {
                data: attachment.data,
                mimeType: attachment.mimeType,
              },
            },
            {
              text: msg.content || (attachment.name ? `Analyze this file: ${attachment.name}` : 'Analyze this input'),
            },
          ],
        });
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content || '' }],
        });
      }
    }

    // Tools
    const tools: any[] = [];
    if (enableSearch) {
      tools.push({ googleSearch: {} });
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    } else {
      config.systemInstruction =
        'You are Dey, an exceptional, highly capable AI thinking partner and workspace assistant. You write clean, elegant, accurate responses, provide formatted markdown with code snippets, tables, and clear explanations. Be concise, insightful, and adaptable to technical or creative requests.';
    }

    if (selectedThinkingLevel) {
      config.thinkingConfig = { thinkingLevel: selectedThinkingLevel };
    }

    if (tools.length > 0) {
      config.tools = tools;
    }

    let responseStream: any;
    try {
      responseStream = await ai.models.generateContentStream({
        model: selectedModel,
        contents,
        config,
      });
    } catch (primaryErr: any) {
      const errStr = primaryErr?.message || '';
      if (
        (errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE')) &&
        selectedModel !== 'gemini-flash-latest'
      ) {
        console.warn(
          `Model ${selectedModel} is experiencing high demand (503). Auto-falling back to gemini-flash-latest...`
        );
        responseStream = await ai.models.generateContentStream({
          model: 'gemini-flash-latest',
          contents,
          config,
        });
      } else {
        throw primaryErr;
      }
    }

    for await (const chunk of responseStream) {
      const text = chunk.text;
      const candidates = chunk.candidates || [];
      const searchChunks = candidates[0]?.groundingMetadata?.groundingChunks;
      const webSearchQueries = candidates[0]?.groundingMetadata?.webSearchQueries;

      const payload: any = {};
      if (text) {
        payload.text = text;
      }
      if (searchChunks && searchChunks.length > 0) {
        payload.grounding = searchChunks;
      }
      if (webSearchQueries && webSearchQueries.length > 0) {
        payload.queries = webSearchQueries;
      }

      if (Object.keys(payload).length > 0) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    let errorMessage = error?.message || 'An error occurred while generating response';
    try {
      const parsed = JSON.parse(errorMessage);
      if (parsed?.error?.message) {
        errorMessage = parsed.error.message;
      }
    } catch {
      // not JSON string, keep as is
    }
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Serve frontend in dev or prod
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dey AI Workspace server running on http://0.0.0.0:${PORT}`);
  });
}

start();
