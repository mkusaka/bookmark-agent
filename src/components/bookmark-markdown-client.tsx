'use client';

import { MarkdownSourceViewer } from './markdown-source-viewer';

interface BookmarkMarkdownClientProps {
  content: string | null;
}

export function BookmarkMarkdownClient({ content }: BookmarkMarkdownClientProps) {
  if (!content) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
        <p className="text-yellow-800 dark:text-yellow-200">
          Unable to fetch content from this URL.
        </p>
      </div>
    );
  }

  return <MarkdownSourceViewer content={content} />;
}