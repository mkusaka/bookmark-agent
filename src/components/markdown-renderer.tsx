'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Override default components for better styling
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-gray-100">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">{children}</p>
            ),
            a: ({ href, children }) => (
              <a 
                href={href} 
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            code: ({ className, children, ...props }) => {
              // Check if it's an inline code or a code block
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !match && !('inline' in props);
              
              if (isInline) {
                return (
                  <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                    {children}
                  </code>
                );
              }
              
              // For code blocks, use Shiki
              return (
                <CodeBlock 
                  code={String(children).replace(/\n$/, '')} 
                  language={match?.[1] || 'text'} 
                />
              );
            },
            pre: ({ children }) => {
              // Check if children is a code element with Shiki content
              if (React.isValidElement(children) && children.props) {
                return <>{children}</>;
              }
              
              // Fallback for non-code content in pre
              return (
                <pre className="bg-gray-100 dark:bg-gray-800 rounded p-4 overflow-x-auto my-4 font-mono text-sm">
                  {children}
                </pre>
              );
            },
            ul: ({ children }) => (
              <ul className="list-disc list-inside my-4 space-y-2 text-gray-700 dark:text-gray-300">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside my-4 space-y-2 text-gray-700 dark:text-gray-300">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="ml-4">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 italic my-4 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 py-2 pr-4 rounded-r">
                {children}
              </blockquote>
            ),
            img: ({ src, alt }) => (
              <img 
                src={src} 
                alt={alt} 
                className="rounded-lg max-w-full h-auto my-4 shadow-md"
              />
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-100 dark:bg-gray-800">
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 font-semibold text-left text-gray-900 dark:text-gray-100">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                {children}
              </td>
            ),
            hr: () => (
              <hr className="my-8 border-gray-300 dark:border-gray-600" />
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic">{children}</em>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}