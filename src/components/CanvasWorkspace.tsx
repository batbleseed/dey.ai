import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Play,
  FileCode,
  Sparkles,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  Code,
} from 'lucide-react';
import { CanvasDocument } from '../types';

interface CanvasWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  documents: CanvasDocument[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onUpdateDoc: (id: string, content: string, title?: string) => void;
  onCreateDoc: (title: string, language: string, content?: string) => void;
  onDeleteDoc: (id: string) => void;
  onAskDeyToEdit: (prompt: string, currentContent: string) => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  isOpen,
  onClose,
  documents,
  activeDocId,
  onSelectDoc,
  onUpdateDoc,
  onCreateDoc,
  onDeleteDoc,
  onAskDeyToEdit,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  useEffect(() => {
    // If active document is HTML, default to preview available
    if (activeDoc && (activeDoc.language === 'html' || activeDoc.content.includes('<!DOCTYPE') || activeDoc.content.includes('<html'))) {
      // preview is supported
    } else {
      setViewMode('code');
    }
  }, [activeDocId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!activeDoc) return;
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const ext =
      activeDoc.language === 'typescript'
        ? 'ts'
        : activeDoc.language === 'javascript'
        ? 'js'
        : activeDoc.language === 'html'
        ? 'html'
        : activeDoc.language === 'python'
        ? 'py'
        : activeDoc.language === 'json'
        ? 'json'
        : 'txt';
    link.download = `${activeDoc.title.replace(/\s+/g, '_')}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNewDocument = () => {
    const title = `Scratchpad ${documents.length + 1}`;
    onCreateDoc(title, 'typescript', '// Start coding or drafting here...\n');
  };

  const handleQuickAction = (instruction: string) => {
    if (!activeDoc) return;
    onAskDeyToEdit(
      `Please ${instruction} for the following code snippet from the canvas:\n\n\`\`\`${activeDoc.language}\n${activeDoc.content}\n\`\`\``,
      activeDoc.content
    );
  };

  const handleCustomAiEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || !activeDoc) return;
    onAskDeyToEdit(
      `Update the following canvas document based on this instruction: "${aiPrompt.trim()}".\n\n\`\`\`${activeDoc.language}\n${activeDoc.content}\n\`\`\``,
      activeDoc.content
    );
    setAiPrompt('');
  };

  const canPreview =
    activeDoc &&
    (activeDoc.language === 'html' ||
      activeDoc.content.includes('<html') ||
      activeDoc.content.includes('<!DOCTYPE') ||
      activeDoc.content.includes('<div') ||
      activeDoc.content.includes('<svg'));

  return (
    <aside
      id="dey-canvas-panel"
      className={`border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col z-30 transition-all duration-200 shadow-xl md:shadow-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-full'
          : 'fixed inset-y-0 right-0 w-full sm:w-[480px] lg:w-[560px] xl:w-[620px] md:static'
      }`}
    >
      {/* Canvas Top Bar */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 truncate">
              <span>Dey Canvas</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
                Workspace
              </span>
            </span>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-1">
          {canPreview && (
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs mr-2">
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                  viewMode === 'code'
                    ? 'bg-white dark:bg-neutral-700 font-semibold shadow-2xs text-neutral-900 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-white dark:bg-neutral-700 font-semibold shadow-2xs text-neutral-900 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Copy Content"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Download Document"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex items-center px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 overflow-x-auto gap-1 scrollbar-thin">
        {documents.map((doc) => {
          const isActive = doc.id === (activeDoc?.id || '');
          return (
            <div
              key={doc.id}
              onClick={() => onSelectDoc(doc.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer shrink-0 transition-colors ${
                isActive
                  ? 'bg-white dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-white shadow-2xs border border-neutral-200 dark:border-neutral-700'
                  : 'text-neutral-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-900'
              }`}
            >
              <span className="truncate max-w-[120px]">{doc.title}</span>
              {documents.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDoc(doc.id);
                  }}
                  className="p-0.5 hover:text-red-500 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={handleNewDocument}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors shrink-0"
          title="Create new canvas file"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Document details header */}
      {activeDoc && (
        <div className="px-4 py-2 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/60 bg-white dark:bg-neutral-900">
          <input
            type="text"
            value={activeDoc.title}
            onChange={(e) => onUpdateDoc(activeDoc.id, activeDoc.content, e.target.value)}
            className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-emerald-500 focus:outline-none w-48 truncate"
          />

          <select
            value={activeDoc.language}
            onChange={(e) => {
              const newLang = e.target.value;
              const title = activeDoc.title.includes('.')
                ? activeDoc.title.split('.')[0] + `.${newLang}`
                : activeDoc.title;
              onUpdateDoc(activeDoc.id, activeDoc.content, title);
            }}
            className="text-[11px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-0.5 text-neutral-700 dark:text-neutral-300 focus:outline-none"
          >
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="html">HTML / Web</option>
            <option value="python">Python</option>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
            <option value="css">CSS</option>
            <option value="sql">SQL</option>
          </select>
        </div>
      )}

      {/* Content Area: Editor or Preview */}
      <div className="flex-1 min-h-0 relative">
        {viewMode === 'preview' && canPreview ? (
          <div className="w-full h-full bg-white">
            <iframe
              title="Canvas Live Preview"
              sandbox="allow-scripts allow-modals allow-same-origin"
              srcDoc={activeDoc?.content || ''}
              className="w-full h-full border-none"
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <textarea
              id="canvas-editor-textarea"
              value={activeDoc?.content || ''}
              onChange={(e) => activeDoc && onUpdateDoc(activeDoc.id, e.target.value)}
              placeholder="Paste or write notes, code, and documentation here..."
              className="w-full flex-1 p-4 font-mono text-xs md:text-[13px] leading-relaxed bg-neutral-950 text-neutral-100 resize-none focus:outline-none scrollbar-thin"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Dey Canvas AI Collaboration Assistant Bar */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase text-neutral-400">Quick AI Actions:</span>
          <button
            onClick={() => handleQuickAction('review, optimize performance, and refactor')}
            className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 hover:text-emerald-500 transition-colors"
          >
            Optimize
          </button>
          <button
            onClick={() => handleQuickAction('add comprehensive documentation comments and docstrings')}
            className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 hover:text-emerald-500 transition-colors"
          >
            Add Docs
          </button>
          <button
            onClick={() => handleQuickAction('identify potential bugs, edge cases, and add error handling')}
            className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 hover:text-emerald-500 transition-colors"
          >
            Fix Bugs
          </button>
          <button
            onClick={() => handleQuickAction('explain line by line how this works and its time complexity')}
            className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 hover:text-emerald-500 transition-colors"
          >
            Explain
          </button>
        </div>

        {/* Prompt to Dey for Canvas */}
        <form onSubmit={handleCustomAiEdit} className="flex items-center gap-1.5">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ask Dey to edit or transform this canvas..."
            className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!aiPrompt.trim()}
            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            title="Ask Dey"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
