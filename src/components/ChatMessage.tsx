import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Code2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Edit3,
  FileText,
  BrainCircuit,
  AlertCircle,
} from 'lucide-react';
import { Message, Attachment } from '../types';
import { DeyLogo } from './DeyLogo';
import type { User } from 'firebase/auth';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: () => void;
  onEditPrompt?: (newContent: string) => void;
  onOpenInCanvas?: (title: string, code: string, language: string) => void;
  onRate?: (rating: 'like' | 'dislike') => void;
  widthMode?: 'wide' | 'full' | 'compact';
  currentUser?: User | null;
  onOpenAccountModal?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLast,
  onRegenerate,
  onEditPrompt,
  onOpenInCanvas,
  onRate,
  widthMode = 'wide',
  currentUser,
  onOpenAccountModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showThinking, setShowThinking] = useState(false);
  const [codeCopiedIndex, setCodeCopiedIndex] = useState<number | null>(null);

  const isUser = message.role === 'user';
  const isAnonymous = !currentUser || currentUser.isAnonymous;
  const userDisplayName = currentUser?.displayName
    || (currentUser?.email ? currentUser.email.split('@')[0] : null)
    || 'You';
  const userInitial = (userDisplayName || currentUser?.email || 'U').charAt(0).toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCodeCopiedIndex(index);
    setTimeout(() => setCodeCopiedIndex(null), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown before speaking
    const cleanText = message.content.replace(/```[\s\S]*?```/g, 'Code block omitted.').replace(/[#*_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editText.trim() && onEditPrompt) {
      onEditPrompt(editText.trim());
      setIsEditing(false);
    }
  };

  let codeBlockCounter = 0;

  // Separate rendering for User messages (right-aligned, no user icon, no username)
  if (isUser) {
    return (
      <div className="py-2.5 px-4 md:px-6 transition-colors duration-150 bg-transparent">
        <div
          className={`transition-all duration-200 ${
            widthMode === 'full'
              ? 'w-full max-w-none px-2 sm:px-4 md:px-8'
              : widthMode === 'compact'
              ? 'w-full max-w-3xl xl:max-w-4xl mx-auto'
              : 'w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto'
          }`}
        >
          <div className="flex justify-end group">
            <div className="max-w-[85%] sm:max-w-xl md:max-w-2xl flex flex-col items-end">
              {/* User Attachment Preview */}
              {message.attachment && (
                <div className="mb-2">
                  {message.attachment.mimeType.startsWith('image/') ? (
                    <div className="relative inline-block rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xs max-w-sm">
                      <img
                        src={
                          message.attachment.data.startsWith('data:')
                            ? message.attachment.data
                            : `data:${message.attachment.mimeType};base64,${message.attachment.data}`
                        }
                        alt={message.attachment.name}
                        className="max-h-64 object-contain rounded-2xl bg-neutral-100 dark:bg-neutral-950"
                      />
                      <div className="text-[11px] bg-black/60 text-white px-2.5 py-1 absolute bottom-0 inset-x-0 truncate backdrop-blur-xs">
                        {message.attachment.name}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 max-w-sm">
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate">
                        {message.attachment.name}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Message Content Bubble / Inline Edit Form */}
              {isEditing ? (
                <form onSubmit={handleSaveEdit} className="w-full min-w-[280px] sm:min-w-[420px] space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-3.5 text-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-500 transition-colors cursor-pointer"
                    >
                      Save & Submit
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-2 group/bubble">
                  {/* Subtle Edit Action Button on hover */}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-xs cursor-pointer"
                    title="Edit message"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <div className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-4.5 py-3 rounded-2xl md:rounded-3xl rounded-br-md text-sm md:text-[15px] leading-relaxed shadow-xs border border-neutral-200/70 dark:border-neutral-700/60 break-words font-sans">
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assistant (Dey) Message Rendering (left-aligned with Dey avatar and toolbar)
  return (
    <div className="py-5 px-4 md:px-6 transition-colors duration-150 bg-neutral-50/60 dark:bg-neutral-900/40 border-y border-neutral-100 dark:border-neutral-800/40">
      <div
        className={`flex gap-3 md:gap-4 items-start transition-all duration-200 ${
          widthMode === 'full'
            ? 'w-full max-w-none px-2 sm:px-4 md:px-8'
            : widthMode === 'compact'
            ? 'w-full max-w-3xl xl:max-w-4xl mx-auto'
            : 'w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto'
        }`}
      >
        {/* Assistant Avatar */}
        <div className="shrink-0 mt-0.5">
          <DeyLogo size="sm" />
        </div>

        {/* Message Content Area */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Dey
              </span>
              {message.modelUsed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-500 font-mono">
                  {message.modelUsed}
                </span>
              )}
            </div>
          </div>

          {/* Thinking / Reasoning Section */}
          {message.thinking && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400 w-full text-left"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Thinking Process</span>
                {showThinking ? (
                  <ChevronDown className="w-3.5 h-3.5 ml-auto" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                )}
              </button>

              {showThinking && (
                <div className="mt-2 text-neutral-600 dark:text-neutral-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap border-t border-amber-500/10 pt-2">
                  {message.thinking}
                </div>
              )}
            </div>
          )}

          {/* Markdown Message Content */}
          <div className="text-neutral-900 dark:text-neutral-100 text-sm md:text-[15px] leading-relaxed break-words font-sans">
            <Markdown
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold mt-4 mb-2 text-neutral-950 dark:text-white">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold mt-3.5 mb-1.5 text-neutral-900 dark:text-neutral-100">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mt-3 mb-1 text-neutral-900 dark:text-neutral-200">
                      {children}
                    </h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 mb-3 space-y-1 text-neutral-800 dark:text-neutral-200">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 mb-3 space-y-1 text-neutral-800 dark:text-neutral-200">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="pl-0.5">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-3 border-emerald-500 pl-3.5 py-0.5 my-3 italic text-neutral-600 dark:text-neutral-400">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="my-3 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <table className="w-full text-left text-xs border-collapse">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {children}
                    </tbody>
                  ),
                  th: ({ children }) => <th className="p-2.5 font-semibold">{children}</th>,
                  td: ({ children }) => <td className="p-2.5">{children}</td>,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-700"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    const codeStr = String(children).replace(/\n$/, '');

                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-xs"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    const language = match ? match[1] : 'plaintext';
                    const blockIndex = ++codeBlockCounter;
                    const isBlockCopied = codeCopiedIndex === blockIndex;

                    return (
                      <div className="my-3 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-100 font-mono text-xs shadow-xs">
                        {/* Code Header */}
                        <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900 border-b border-neutral-800 select-none">
                          <span className="text-[11px] font-medium text-neutral-400 lowercase">
                            {language}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {onOpenInCanvas && (
                              <button
                                onClick={() =>
                                  onOpenInCanvas(
                                    `Snippet (${language})`,
                                    codeStr,
                                    language
                                  )
                                }
                                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                                title="Open snippet in Dey Canvas Workspace"
                              >
                                <Code2 className="w-3 h-3 text-emerald-400" />
                                <span>Canvas</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyCode(codeStr, blockIndex)}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                              title="Copy Code"
                            >
                              {isBlockCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Code Body */}
                        <pre className="p-3.5 overflow-x-auto text-[13px] leading-relaxed scrollbar-thin">
                          <code>{children}</code>
                        </pre>
                      </div>
                    );
                  },
                }}
              >
                {message.content}
              </Markdown>
            </div>

          {/* Grounding / Search Sources */}
          {message.grounding && message.grounding.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span>Sources</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.grounding.map((src, idx) => {
                  const url = src.web?.uri;
                  const title = src.web?.title || url;
                  if (!url) return null;
                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors border border-neutral-200 dark:border-neutral-700/60 max-w-xs truncate"
                    >
                      <span className="truncate">{title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-neutral-400" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error notice */}
          {message.error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{message.error}</span>
            </div>
          )}

          {/* Streaming Indicator */}
          {message.isStreaming && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span className="font-mono text-[11px]">Dey is thinking and typing...</span>
            </div>
          )}

          {/* Action Toolbar for AI responses */}
          {!isUser && !message.isStreaming && (
            <div className="flex items-center gap-1 pt-2 select-none">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
                title="Copy entire response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={handleSpeak}
                className={`p-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors ${
                  isSpeaking
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {onRate && (
                <>
                  <button
                    onClick={() => onRate('like')}
                    className={`p-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors ${
                      message.rating === 'like'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                    title="Good response"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onRate('dislike')}
                    className={`p-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors ${
                      message.rating === 'dislike'
                        ? 'text-red-500'
                        : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                    title="Poor response"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {isLast && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors ml-1"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
