'use client';

import { useEffect, useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    async function highlightCode() {
      try {
        // Dynamic import to avoid SSR issues
        const { codeToHtml } = await import('shiki');
        
        const highlighted = await codeToHtml(code, {
          lang: language,
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
        });
        setHtml(highlighted);
      } catch (error) {
        console.error('Failed to highlight code:', error);
        // Fallback to plain text
        setHtml(`<pre><code>${code}</code></pre>`);
      }
    }

    highlightCode();
  }, [code, language]);

  if (!html) {
    return (
      <pre className="bg-gray-100 dark:bg-gray-800 rounded p-4 overflow-x-auto my-4">
        <code className="text-sm font-mono">{code}</code>
      </pre>
    );
  }

  return (
    <div 
      className="my-4 overflow-x-auto rounded-lg shiki-wrapper"
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        // Shiki generates inline styles, so we need to use CSS custom properties
        // to make it work with dark mode
        '--shiki-light': 'initial',
        '--shiki-dark': 'initial',
        '--shiki-light-bg': 'initial', 
        '--shiki-dark-bg': 'initial',
      } as React.CSSProperties}
    />
  );
}