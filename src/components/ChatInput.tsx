import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Globe,
  BrainCircuit,
  Mic,
  MicOff,
  X,
  FileText,
  Image as ImageIcon,
  Code2,
  Lightbulb,
  ArrowUpRight,
} from 'lucide-react';
import { Attachment } from '../types';

interface PromptCard {
  title: string;
  subtitle: string;
  prompt: string;
  icon: React.ReactNode;
}

const PROMPT_SUGGESTIONS: PromptCard[] = [
  {
    title: 'Code & Architecture',
    subtitle: 'Build a production debounce hook in TypeScript',
    prompt:
      'Write a clean, reusable TypeScript custom React hook `useDebounce` with full type safety, cleanup handling, and an example component.',
    icon: <Code2 className="w-3.5 h-3.5 text-emerald-500" />,
  },
  {
    title: 'Complex Reasoning',
    subtitle: 'Solve an algorithmic optimization step-by-step',
    prompt:
      'Explain how the Raft consensus algorithm handles leader election and log replication during network partitions, step-by-step with clear state transitions.',
    icon: <Lightbulb className="w-3.5 h-3.5 text-purple-500" />,
  },
];

interface ChatInputProps {
  onSendMessage: (content: string, attachment?: Attachment) => void;
  isLoading: boolean;
  onStop: () => void;
  enableSearch: boolean;
  onToggleSearch: () => void;
  enableThinking: boolean;
  onToggleThinking: () => void;
  widthMode?: 'wide' | 'full' | 'compact';
  showSuggestions?: boolean;
  onSelectPrompt?: (prompt: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStop,
  enableSearch,
  onToggleSearch,
  enableThinking,
  onToggleThinking,
  widthMode = 'wide',
  showSuggestions = false,
  onSelectPrompt,
}) => {
  const [prompt, setPrompt] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  // Speech recognition setup
  const toggleRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported by your browser.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsRecording(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = file.type || 'application/octet-stream';
      // Base64 data without data:prefix
      const base64Data = result.split(',')[1] || '';

      setAttachment({
        name: file.name,
        type: file.type,
        mimeType,
        data: base64Data,
        previewUrl: file.type.startsWith('image/') ? result : undefined,
        size: file.size,
      });
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      // For text/code documents
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSuggestion = (suggestionPrompt: string) => {
    setPrompt(suggestionPrompt);
    if (onSelectPrompt) {
      onSelectPrompt(suggestionPrompt);
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = suggestionPrompt.length;
        textareaRef.current.setSelectionRange(len, len);
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }, 30);
  };

  const handleSubmit = () => {
    if ((!prompt.trim() && !attachment) || isLoading) return;
    onSendMessage(prompt.trim(), attachment || undefined);
    setPrompt('');
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full shrink-0 select-none pb-4 pt-1">
      <div
        className={`transition-all duration-200 ${
          widthMode === 'full'
            ? 'w-full max-w-none px-4 sm:px-8 md:px-12'
            : widthMode === 'compact'
            ? 'w-full max-w-3xl xl:max-w-4xl mx-auto px-4 sm:px-6'
            : 'w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-8'
        }`}
      >
        {/* Input container */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full relative rounded-3xl bg-white dark:bg-neutral-800/90 border transition-all duration-200 shadow-sm overflow-hidden ${
            isDragging
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
              : 'border-neutral-200/80 dark:border-neutral-700/70 focus-within:border-neutral-400 dark:focus-within:border-neutral-500'
          }`}
        >
        {/* Sticking Prompt Suggestions Box - Stacked & Centered */}
        {showSuggestions && (
          <div
            id="prompt-suggestions-box"
            className="w-full border-b border-neutral-200/80 dark:border-neutral-700/70 bg-neutral-50/60 dark:bg-neutral-900/50"
          >
            <div className="flex flex-col divide-y divide-neutral-200/60 dark:divide-neutral-700/60">
              {PROMPT_SUGGESTIONS.map((card, idx) => (
                <button
                  key={idx}
                  id={`prompt-suggestion-item-${idx}`}
                  type="button"
                  onClick={() => handleSelectSuggestion(card.prompt)}
                  className="w-full group px-4 py-2.5 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/70 transition-colors flex items-center justify-center text-center gap-2 cursor-pointer min-w-0"
                  title="Insert into message box to edit"
                >
                  <span className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    {card.icon}
                  </span>
                  <div className="flex items-center justify-center gap-1.5 min-w-0 text-center">
                    <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                      {card.title}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-600 font-light text-[10px]">•</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {card.subtitle}
                    </span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active attachment pill */}
        {attachment && (
          <div className="pt-3 px-3.5 flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 max-w-sm text-xs shadow-2xs">
              {attachment.previewUrl ? (
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className="w-7 h-7 rounded-lg object-cover"
                />
              ) : (
                <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
              )}
              <div className="truncate">
                <span className="font-medium text-neutral-800 dark:text-neutral-200 block truncate">
                  {attachment.name}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {(attachment.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1 text-neutral-400 hover:text-red-500 rounded-full transition-colors ml-1"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Textarea input */}
        <textarea
          id="chat-textarea-input"
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Dey... (Shift+Enter for new line)"
          rows={1}
          className="w-full bg-transparent px-4 pt-3.5 pb-2 text-sm md:text-base text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 resize-none focus:outline-none min-h-[44px] max-h-[200px]"
        />

        {/* Bottom Toolbar inside input container */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Left tools */}
          <div className="flex items-center gap-1">
            {/* File Upload Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.txt,.js,.ts,.tsx,.json,.py,.md,.csv"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              title="Attach image or document"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web Search Button */}
            <button
              type="button"
              onClick={onToggleSearch}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                enableSearch
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
              title="Search the web with Google Grounding"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Reasoning Button */}
            <button
              type="button"
              onClick={onToggleThinking}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                enableThinking
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
              title="Deep Chain-of-Thought Reasoning"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reason</span>
            </button>

            {/* Mic button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2 rounded-full transition-colors ${
                isRecording
                  ? 'text-red-500 bg-red-500/10 animate-pulse'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
              title={isRecording ? 'Stop voice recording' : 'Dictate with voice'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Right send/stop button */}
          <div>
            {isLoading ? (
              <button
                type="button"
                id="stop-generation-btn"
                onClick={onStop}
                className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center hover:opacity-80 transition-opacity shadow-xs"
                title="Stop generating"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                id="send-message-btn"
                onClick={handleSubmit}
                disabled={!prompt.trim() && !attachment}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  prompt.trim() || attachment
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 shadow-xs'
                    : 'bg-neutral-300/80 dark:bg-neutral-700/60 text-neutral-400 cursor-not-allowed'
                }`}
                title="Send prompt"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

        <div className="mt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
          Dey may produce inaccurate information. Review important details.
        </div>
      </div>
    </div>
  );
};
