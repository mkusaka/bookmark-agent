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
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function highlightMarkdown() {
      try {
        setIsLoading(true);
        // Dynamic import to avoid SSR issues
        const { codeToHtml } = await import('shiki');
        
        const highlighted = await codeToHtml(content, {
          lang: 'markdown',
          themes: {
            light: 'vitesse-light',
            dark: 'vitesse-dark',
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
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const lines = content.split('\n').length;
  const estimatedHeight = Math.min(lines * 20, 800);

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4' : ''}`}>
      <div className={`bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 z-10">
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
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Copy to clipboard"
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
          className={`markdown-source-viewer ${isFullscreen ? 'flex-1 overflow-y-auto' : ''}`}
          style={!isFullscreen ? { maxHeight: `${estimatedHeight}px` } : undefined}
          dangerouslySetInnerHTML={{ __html: html }}
        />
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