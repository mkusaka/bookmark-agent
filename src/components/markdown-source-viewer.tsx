'use client';

import { useEffect, useState } from 'react';

interface MarkdownSourceViewerProps {
  content: string;
}

export function MarkdownSourceViewer({ content }: MarkdownSourceViewerProps) {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

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
            dark: 'github-dark',
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

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Markdown Source
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Copy to clipboard"
          >
            Copy
          </button>
        </div>
      </div>
      <div 
        className="markdown-source-viewer overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          '--shiki-light': 'initial',
          '--shiki-dark': 'initial',
          '--shiki-light-bg': 'initial', 
          '--shiki-dark-bg': 'initial',
        } as React.CSSProperties}
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