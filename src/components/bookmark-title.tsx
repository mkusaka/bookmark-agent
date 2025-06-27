'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface BookmarkTitleProps {
  title?: string;
  url: string;
  bookmarkId: string;
}

export function BookmarkTitle({ title, url, bookmarkId }: BookmarkTitleProps) {
  const displayText = title || url;
  const searchParams = useSearchParams();
  
  // Get current search params as string
  const currentSearchParams = searchParams.toString();
  
  // Build detail page URL with return URL parameter
  const detailUrl = currentSearchParams
    ? `/bookmarks/${bookmarkId}?return=${encodeURIComponent('/search?' + currentSearchParams)}`
    : `/bookmarks/${bookmarkId}`;
  
  return (
    <div className="flex items-start gap-2">
      <Link
        href={detailUrl}
        className="font-medium text-primary hover:underline block break-words whitespace-normal flex-1"
      >
        {displayText}
      </Link>
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
        title="Open in new tab"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}