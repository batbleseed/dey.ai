import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, FileCode } from 'lucide-react';
import { ChatSession } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatSession | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, chat }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !chat) return null;

  const generateMarkdown = () => {
    let md = `# ${chat.title || 'Dey Conversation'}\n`;
    md += `*Date: ${new Date(chat.createdAt).toLocaleString()}*\n\n---\n\n`;

    chat.messages.forEach((msg) => {
      const sender = msg.role === 'user' ? '### 👤 User' : '### ✦ Dey';
      md += `${sender}\n\n${msg.content}\n\n`;
      if (msg.grounding && msg.grounding.length > 0) {
        md += `*Sources:*\n`;
        msg.grounding.forEach((src) => {
          if (src.web?.uri) {
            md += `- [${src.web.title || src.web.uri}](${src.web.uri})\n`;
          }
        });
        md += '\n';
      }
      md += `---\n\n`;
    });
    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (format: 'md' | 'json' | 'txt') => {
    let content = '';
    let mimeType = 'text/plain';
    const filename = `${chat.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'dey_chat'}.${format}`;

    if (format === 'md') {
      content = generateMarkdown();
      mimeType = 'text/markdown';
    } else if (format === 'json') {
      content = JSON.stringify(chat, null, 2);
      mimeType = 'application/json';
    } else {
      content = chat.messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Dey'}:\n${m.content}\n`)
        .join('\n---\n\n');
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div
        id="export-modal"
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Export Conversation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
            Export &quot;{chat.title}&quot; in your preferred format for documentation or sharing.
          </p>

          <button
            onClick={handleCopyMarkdown}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors text-xs font-medium text-neutral-800 dark:text-neutral-200"
          >
            <div className="flex items-center gap-2.5">
              <Copy className="w-4 h-4 text-emerald-500" />
              <span>Copy as Formatted Markdown</span>
            </div>
            {copied ? (
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Copied
              </span>
            ) : null}
          </button>

          <button
            onClick={() => handleDownloadFile('md')}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors text-xs font-medium text-neutral-800 dark:text-neutral-200"
          >
            <div className="flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-blue-500" />
              <span>Download Markdown (.md)</span>
            </div>
            <Download className="w-4 h-4 text-neutral-400" />
          </button>

          <button
            onClick={() => handleDownloadFile('json')}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors text-xs font-medium text-neutral-800 dark:text-neutral-200"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Download JSON Data (.json)</span>
            </div>
            <Download className="w-4 h-4 text-neutral-400" />
          </button>

          <button
            onClick={() => handleDownloadFile('txt')}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors text-xs font-medium text-neutral-800 dark:text-neutral-200"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-purple-500" />
              <span>Download Plain Text (.txt)</span>
            </div>
            <Download className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
