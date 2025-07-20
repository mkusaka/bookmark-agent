'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Maximize2, Minimize2 } from 'lucide-react';

interface MarkdownSourceViewerProps {
  content: string;
}

export function MarkdownSourceViewer({ content }: MarkdownSourceViewerProps) {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function highlightMarkdown() {
      try {
        setIsLoading(true);
        const { codeToHtml } = await import('shiki');
        
        const highlighted = await codeToHtml(content, {
          lang: 'markdown',
          themes: {
            light: 'vitesse-light',
            dark: 'vitesse-dark',
          },
        });
        setHtml(highlighted);
      } catch {
        // Fallback to plain text if highlighting fails
        setHtml(`<pre><code>${escapeHtml(content)}</code></pre>`);
      } finally {
        setIsLoading(false);
      }
    }

    highlightMarkdown();
  }, [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Copy failed, toast already shown
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Markdown Source
            </span>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-900">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const lines = content.split('\n').length;

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Markdown Source
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {lines} lines
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Minimize</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span>Expand</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <div 
        className={`shiki-container bg-white dark:bg-gray-900 overflow-auto ${isExpanded ? 'h-[calc(100%-53px)]' : ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}