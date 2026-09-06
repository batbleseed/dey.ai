import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { SettingsPanel } from './components/SettingsPanel';
import { ExportModal } from './components/ExportModal';
import { AccountModal } from './components/AccountModal';
import {
  ChatSession,
  Message,
  Attachment,
  CanvasDocument,
  WorkspaceSettings,
} from './types';
import {
  loadStoredChats,
  saveStoredChats,
  loadStoredSettings,
  saveStoredSettings,
  loadStoredCanvasDocs,
  saveStoredCanvasDocs,
  DEFAULT_SETTINGS,
} from './utils/storage';
import {
  auth,
  initAuth,
  loginWithGoogle,
  logoutUser,
  updateUserProfile,
  fetchUserProfile,
  syncChatToCloud,
  fetchChatsFromCloud,
  deleteChatFromCloud,
  syncUserSettingsToCloud,
  fetchUserSettingsFromCloud,
  syncCanvasDocToCloud,
  fetchCanvasDocsFromCloud,
  deleteCanvasDocFromCloud,
} from './lib/firebase';
import type { User } from 'firebase/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [chats, setChats] = useState<ChatSession[]>(loadStoredChats);
  const [activeChatId, setActiveChatId] = useState<string>(() => {
    const initial = loadStoredChats();
    return initial[0]?.id || 'welcome-session';
  });

  const [settings, setSettings] = useState<WorkspaceSettings>(loadStoredSettings);
  const [selectedModel, setSelectedModel] = useState<string>(() => settings.defaultModel);
  const [enableSearch, setEnableSearch] = useState<boolean>(() => settings.enableWebSearch);
  const [enableThinking, setEnableThinking] = useState<boolean>(
    () => settings.defaultModel === 'gemini-3.8-flash-thinking'
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isCanvasOpen, setIsCanvasOpen] = useState<boolean>(false);
  const [canvasDocs, setCanvasDocs] = useState<CanvasDocument[]>(loadStoredCanvasDocs);
  const [activeDocId, setActiveDocId] = useState<string>(() => {
    const docs = loadStoredCanvasDocs();
    return docs[0]?.id || 'demo-canvas-1';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'persona' | 'model' | 'providers' | 'interface' | 'beta' | 'cloud' | 'data' | undefined
  >('persona');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportTargetChat, setExportTargetChat] = useState<ChatSession | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleOpenSettings = (tab?: string) => {
    if (tab) {
      setSettingsInitialTab(tab as any);
    }
    setIsSettingsOpen(true);
  };

  // Sync active chat session
  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // Apply theme class to documentElement
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Persist chats
  useEffect(() => {
    saveStoredChats(chats);
  }, [chats]);

  // Persist canvas docs
  useEffect(() => {
    saveStoredCanvasDocs(canvasDocs);
  }, [canvasDocs]);

  // Persist settings locally
  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Initialize Firebase Auth and initial Cloud Firestore synchronization
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!isMounted) return;
      if (user) {
        setCurrentUser(user);
        setIsCloudSyncing(true);
        try {
          const [cloudSettings, cloudChats, cloudCanvas, cloudProfile] = await Promise.all([
            fetchUserSettingsFromCloud(user.uid),
            fetchChatsFromCloud(user.uid),
            fetchCanvasDocsFromCloud(user.uid),
            fetchUserProfile(user.uid),
          ]);
          if (!isMounted) return;
          if (cloudProfile?.displayName && cloudProfile.displayName !== user.displayName) {
            await updateUserProfile(cloudProfile.displayName, cloudProfile.photoURL || user.photoURL || undefined);
            if (auth.currentUser && isMounted) {
              setCurrentUser(Object.assign(Object.create(Object.getPrototypeOf(auth.currentUser)), auth.currentUser));
            }
          }
          if (cloudSettings) {
            setSettings((prev) => ({ ...prev, ...cloudSettings }));
          }
          if (cloudChats && cloudChats.length > 0) {
            setChats(cloudChats);
            setActiveChatId(cloudChats[0].id);
          } else {
            // Seed initial chats to Cloud Firestore for this user
            const currentChats = loadStoredChats();
            for (const c of currentChats) {
              await syncChatToCloud(user.uid, c);
            }
          }
          if (cloudCanvas && cloudCanvas.length > 0) {
            setCanvasDocs(cloudCanvas);
            setActiveDocId(cloudCanvas[0].id);
          } else {
            // Seed initial canvas docs to Cloud Firestore
            const currentCanvas = loadStoredCanvasDocs();
            for (const d of currentCanvas) {
              await syncCanvasDocToCloud(user.uid, d);
            }
          }
        } catch (e) {
          console.warn('Initial cloud sync error:', e);
        } finally {
          if (isMounted) setIsCloudSyncing(false);
        }
      } else {
        initAuth().then((u) => {
          if (isMounted && u) setCurrentUser(u);
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Background Cloud Sync for active chat
  useEffect(() => {
    if (!currentUser || !activeChat) return;
    const timer = setTimeout(() => {
      syncChatToCloud(currentUser.uid, activeChat).catch((err) =>
        console.debug('Background chat cloud sync:', err)
      );
    }, 1200);
    return () => clearTimeout(timer);
  }, [activeChat, currentUser]);

  // Background Cloud Sync for workspace settings
  useEffect(() => {
    if (!currentUser) return;
    const timer = setTimeout(() => {
      syncUserSettingsToCloud(currentUser.uid, settings).catch((err) =>
        console.debug('Background settings cloud sync:', err)
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [settings, currentUser]);

  // Background Cloud Sync for active canvas document
  useEffect(() => {
    if (!currentUser) return;
    const activeDoc = canvasDocs.find((d) => d.id === activeDocId);
    if (!activeDoc) return;
    const timer = setTimeout(() => {
      syncCanvasDocToCloud(currentUser.uid, activeDoc).catch((err) =>
        console.debug('Background canvas cloud sync:', err)
      );
    }, 1200);
    return () => clearTimeout(timer);
  }, [canvasDocs, activeDocId, currentUser]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      } else if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setIsCanvasOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeChatId]);

  // Handle Model Change
  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    if (modelId === 'gemini-3.8-flash-thinking') {
      setEnableThinking(true);
    } else {
      setEnableThinking(false);
    }
  };

  // Chat Actions
  const handleNewChat = () => {
    if (isLoading) return;
    const newId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newId,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: selectedModel,
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  const handleDeleteChat = (chatId: string) => {
    if (currentUser) {
      deleteChatFromCloud(currentUser.uid, chatId).catch((err) => console.warn(err));
    }
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== chatId);
      if (remaining.length === 0) {
        const fallback: ChatSession = {
          id: `chat-${Date.now()}`,
          title: 'New Conversation',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        setActiveChatId(fallback.id);
        return [fallback];
      }
      if (activeChatId === chatId) {
        setActiveChatId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  const handleTogglePin = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, isPinned: !c.isPinned, updatedAt: Date.now() } : c
      )
    );
  };

  const handleClearCurrentChat = () => {
    if (!activeChat) return;
    if (confirm('Clear messages in this conversation?')) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id ? { ...c, messages: [], updatedAt: Date.now() } : c
        )
      );
    }
  };

  const handleToggleWidthMode = () => {
    setSettings((prev) => {
      const current = prev.messageBoxWidth || 'wide';
      const next: 'wide' | 'full' | 'compact' =
        current === 'wide' ? 'full' : current === 'full' ? 'compact' : 'wide';
      const updated = { ...prev, messageBoxWidth: next };
      saveStoredSettings(updated);
      return updated;
    });
  };

  // Canvas Actions
  const handleCreateCanvasDoc = (title: string, language: string, content = '') => {
    const newDoc: CanvasDocument = {
      id: `canvas-${Date.now()}`,
      title,
      language,
      content,
      lastModified: Date.now(),
      version: 1,
    };
    setCanvasDocs((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setIsCanvasOpen(true);
  };

  const handleUpdateCanvasDoc = (id: string, content: string, title?: string) => {
    setCanvasDocs((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              content,
              title: title !== undefined ? title : doc.title,
              lastModified: Date.now(),
            }
          : doc
      )
    );
  };

  const handleDeleteCanvasDoc = (id: string) => {
    if (currentUser) {
      deleteCanvasDocFromCloud(currentUser.uid, id).catch((err) => console.warn(err));
    }
    setCanvasDocs((prev) => {
      const remaining = prev.filter((d) => d.id !== id);
      if (remaining.length === 0) {
        const fallback: CanvasDocument = {
          id: `canvas-${Date.now()}`,
          title: 'Notes.md',
          language: 'markdown',
          content: '# Workspace Notes\n',
          lastModified: Date.now(),
          version: 1,
        };
        setActiveDocId(fallback.id);
        return [fallback];
      }
      if (activeDocId === id) {
        setActiveDocId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleManualCloudSync = async () => {
    if (!currentUser) return;
    setIsCloudSyncing(true);
    try {
      await syncUserSettingsToCloud(currentUser.uid, settings);
      for (const chat of chats) {
        await syncChatToCloud(currentUser.uid, chat);
      }
      for (const docItem of canvasDocs) {
        await syncCanvasDocToCloud(currentUser.uid, docItem);
      }
    } catch (err) {
      console.error('Manual cloud sync failed:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleLoginGoogle = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        const profile = await fetchUserProfile(user.uid);
        if (profile?.displayName && profile.displayName !== user.displayName) {
          await updateUserProfile(profile.displayName, profile.photoURL || user.photoURL || undefined);
        }
        setCurrentUser(auth.currentUser || user);
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      const guest = await initAuth();
      if (guest) setCurrentUser(guest);
    } catch (err) {
      console.error('Logout failed:', err);
      throw err;
    }
  };

  const handleUpdateProfile = async (displayName: string, photoURL?: string) => {
    const user = await updateUserProfile(displayName, photoURL);
    if (user) {
      // Create a fresh object reference to trigger react re-render
      setCurrentUser(Object.assign(Object.create(Object.getPrototypeOf(user)), user));
    }
  };

  const handleOpenInCanvas = (title: string, code: string, language: string) => {
    handleCreateCanvasDoc(title, language, code);
  };

  // Send Message logic
  const handleSendMessage = async (userPrompt: string, attachment?: Attachment) => {
    if (!userPrompt && !attachment) return;

    // Create user message
    const userMsgId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: userPrompt,
      timestamp: Date.now(),
      attachment,
    };

    // Resolve model name and custom provider configuration
    const isCustomModel = selectedModel.startsWith('custom:');
    let customProviderPayload: any = undefined;
    let modelDisplayName = selectedModel;

    if (isCustomModel) {
      const parts = selectedModel.split(':');
      const providerId = parts[1];
      const modelName = parts.slice(2).join(':');
      const provider = settings.customProviders?.find((p) => p.id === providerId);
      if (provider) {
        customProviderPayload = {
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey,
          model: modelName,
          providerName: provider.name,
        };
        modelDisplayName = `${provider.name} · ${modelName}`;
      }
    }

    // Placeholder assistant message
    const assistantMsgId = `assistant-${Date.now() + 1}`;
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      modelUsed: modelDisplayName,
    };

    let updatedSessionMessages = [...(activeChat?.messages || []), userMessage];

    // Compute title if first message
    let sessionTitle = activeChat?.title || 'New Conversation';
    if (sessionTitle === 'New Conversation' || sessionTitle === 'Untitled conversation') {
      sessionTitle = userPrompt.slice(0, 32).trim() || 'Multimodal Request';
    }

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              title: sessionTitle,
              updatedAt: Date.now(),
              messages: [...updatedSessionMessages, assistantMessage],
            }
          : c
      )
    );

    setIsLoading(true);
    setTimeout(() => scrollToBottom('smooth'), 50);

    // Abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: updatedSessionMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          customProvider: customProviderPayload,
          systemInstruction: settings.systemInstruction,
          enableSearch,
          thinkingLevel: enableThinking ? 'HIGH' : undefined,
          attachment: attachment
            ? {
                name: attachment.name,
                mimeType: attachment.mimeType,
                data: attachment.data,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let accumulatedSources: any[] = [];

      if (reader) {
        let buffer = '';

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
              const data = JSON.parse(dataStr);
              if (data.error) {
                accumulatedText += `\n\n⚠️ ${data.error}`;
              }
              if (data.text) {
                accumulatedText += data.text;
              }
              if (data.grounding && Array.isArray(data.grounding)) {
                accumulatedSources = [...accumulatedSources, ...data.grounding];
              }

              // Update in real-time
              setChats((prev) =>
                prev.map((c) =>
                  c.id === activeChat.id
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantMsgId
                            ? {
                                ...m,
                                content: accumulatedText,
                                grounding:
                                  accumulatedSources.length > 0 ? accumulatedSources : undefined,
                              }
                            : m
                        ),
                      }
                    : c
                )
              );
              scrollToBottom('auto');
            } catch (err) {
              console.warn('Error parsing SSE line:', err);
            }
          }
        }
      }

      // Finish streaming
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                ),
              }
            : c
        )
      );
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Generation aborted by user');
      } else {
        console.error('Chat error:', error);
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChat.id
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          isStreaming: false,
                          error: error.message || 'Failed to complete generation',
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      // If Canvas response contains code and user wants to update canvas
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                ),
              }
            : c
        )
      );
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleRegenerateLast = () => {
    if (!activeChat || activeChat.messages.length === 0 || isLoading) return;
    const msgs = [...activeChat.messages];
    // Find last user prompt
    const lastUserIdx = msgs.map((m) => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;

    const userPrompt = msgs[lastUserIdx].content;
    const attachment = msgs[lastUserIdx].attachment;

    // Truncate messages back to before last response
    const trimmedMessages = msgs.slice(0, lastUserIdx);
    setChats((prev) =>
      prev.map((c) => (c.id === activeChat.id ? { ...c, messages: trimmedMessages } : c))
    );

    // Resend
    handleSendMessage(userPrompt, attachment);
  };

  const handleEditPrompt = (newPrompt: string) => {
    handleSendMessage(newPrompt);
  };

  const handleRateMessage = (msgId: string, rating: 'like' | 'dislike') => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId
                  ? { ...m, rating: m.rating === rating ? undefined : rating }
                  : m
              ),
            }
          : c
      )
    );
  };

  const handleClearAllData = () => {
    localStorage.clear();
    setChats([
      {
        id: `chat-${Date.now()}`,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      },
    ]);
    setActiveChatId(`chat-${Date.now()}`);
    setCanvasDocs(loadStoredCanvasDocs());
    setSettings(DEFAULT_SETTINGS);
  };

  // Auto-close canvas if beta is disabled
  useEffect(() => {
    if (!settings.enableBeta && isCanvasOpen) {
      setIsCanvasOpen(false);
    }
  }, [settings.enableBeta, isCanvasOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans antialiased select-auto">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        onSelectChat={(id) => setActiveChatId(id)}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onTogglePin={handleTogglePin}
        onOpenSettings={() => setIsSettingsOpen((prev) => !prev)}
        onOpenCanvas={() => setIsCanvasOpen(true)}
        enableBeta={Boolean(settings.enableBeta)}
        onExportChat={(chat) => {
          setExportTargetChat(chat);
          setIsExportOpen(true);
        }}
        theme={settings.theme === 'light' ? 'light' : 'dark'}
        onToggleTheme={() =>
          setSettings((prev) => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark',
          }))
        }
        currentUser={currentUser}
        isCloudSyncing={isCloudSyncing}
        onOpenAccountModal={() => setIsAccountOpen(true)}
        onLoginGoogle={handleLoginGoogle}
        onLogout={handleLogout}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-white dark:bg-neutral-900">
        <ChatHeader
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          isCanvasOpen={Boolean(settings.enableBeta && isCanvasOpen)}
          onToggleCanvas={() => setIsCanvasOpen(!isCanvasOpen)}
          enableBeta={Boolean(settings.enableBeta)}
          enableSearch={enableSearch}
          onToggleSearch={() => setEnableSearch(!enableSearch)}
          enableThinking={enableThinking}
          onToggleThinking={() => setEnableThinking(!enableThinking)}
          onClearChat={handleClearCurrentChat}
          onOpenExport={() => {
            setExportTargetChat(activeChat);
            setIsExportOpen(true);
          }}
          isSettingsOpen={isSettingsOpen}
          onOpenSettings={handleOpenSettings}
          customProviders={settings.customProviders || []}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          title={activeChat?.title || 'Dey AI'}
          widthMode={settings.messageBoxWidth || 'wide'}
          onToggleWidthMode={handleToggleWidthMode}
          currentUser={currentUser}
          onOpenAccountModal={() => setIsAccountOpen(true)}
          theme={settings.theme === 'light' ? 'light' : 'dark'}
          onToggleTheme={() =>
            setSettings((prev) => ({
              ...prev,
              theme: prev.theme === 'dark' ? 'light' : 'dark',
            }))
          }
          onLoginGoogle={handleLoginGoogle}
          onLogout={handleLogout}
        />

        {/* Messages scroll container */}
        <div
          ref={chatScrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scroll-smooth flex flex-col"
        >
          {activeChat?.messages.length === 0 ? (
            <EmptyState
              onSelectPrompt={(p) => handleSendMessage(p)}
              widthMode={settings.messageBoxWidth || 'wide'}
              currentUser={currentUser}
            />
          ) : (
            <div className="py-2">
              {activeChat?.messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLast={index === activeChat.messages.length - 1}
                  onRegenerate={handleRegenerateLast}
                  onEditPrompt={handleEditPrompt}
                  onOpenInCanvas={settings.enableBeta ? handleOpenInCanvas : undefined}
                  onRate={(rating) => handleRateMessage(msg.id, rating)}
                  widthMode={settings.messageBoxWidth || 'wide'}
                  currentUser={currentUser}
                  onOpenAccountModal={() => setIsAccountOpen(true)}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStopGeneration}
          enableSearch={enableSearch}
          onToggleSearch={() => setEnableSearch(!enableSearch)}
          enableThinking={enableThinking}
          onToggleThinking={() => setEnableThinking(!enableThinking)}
          widthMode={settings.messageBoxWidth || 'wide'}
          showSuggestions={activeChat?.messages.length === 0}
        />
      </main>

      {/* Side-by-Side Canvas Workspace Drawer (Beta only) */}
      <CanvasWorkspace
        isOpen={Boolean(settings.enableBeta && isCanvasOpen)}
        onClose={() => setIsCanvasOpen(false)}
        documents={canvasDocs}
        activeDocId={activeDocId}
        onSelectDoc={(id) => setActiveDocId(id)}
        onUpdateDoc={handleUpdateCanvasDoc}
        onCreateDoc={handleCreateCanvasDoc}
        onDeleteDoc={handleDeleteCanvasDoc}
        onAskDeyToEdit={(prompt) => {
          handleSendMessage(prompt);
        }}
      />

      {/* Integrated Settings Panel (Non-modal, docks alongside workspace) */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onClearAllData={handleClearAllData}
        currentUser={currentUser}
        onLoginGoogle={handleLoginGoogle}
        onLogout={handleLogout}
        onManualCloudSync={handleManualCloudSync}
        isSyncing={isCloudSyncing}
        onOpenAccountModal={() => setIsAccountOpen(true)}
        initialTab={settingsInitialTab}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => {
          setIsExportOpen(false);
          setExportTargetChat(null);
        }}
        chat={exportTargetChat}
      />

      {/* Live Account & Profile Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentUser={currentUser}
        onLoginGoogle={handleLoginGoogle}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
      />
    </div>
  );
}
