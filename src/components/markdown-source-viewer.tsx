'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Minimize2 } from 'lucide-react';

interface MarkdownSourceViewerProps {
  content: string;
}

export function MarkdownSourceViewer({ content }: MarkdownSourceViewerProps) {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); // Default to compact view

  useEffect(() => {
    async function highlightMarkdown() {
      try {
        setIsLoading(true);
        // Dynamic import to avoid SSR issues
        const { codeToHtml } = await import('shiki');
        
        const highlighted = await codeToHtml(content, {
          lang: 'markdown',
          themes: {
            light: 'github-light',
            dark: 'github-dark-default',
          },
        });
        setHtml(highlighted);
      } catch (error) {
        console.error('Failed to highlight markdown:', error);
        // Fallback to plain text
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
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Markdown Source
          </span>
        </div>
        <div className="p-8">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  const lines = content.split('\n').length;

  if (!isFullscreen) {
    // Compact view
    return (
      <div className="relative">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
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
                onClick={() => setIsFullscreen(true)}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Expand
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div 
            className="markdown-source-viewer max-h-[400px]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    );
  }

  // Fullscreen view
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900">
      <div className="h-full flex flex-col">
        <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Markdown Source
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {lines} lines
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy All</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              title="Exit fullscreen"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Minimize</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <div 
            className="markdown-source-viewer h-full"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
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