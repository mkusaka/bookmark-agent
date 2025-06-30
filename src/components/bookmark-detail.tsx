'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ExternalLink, Calendar, User, Tag, MessageSquare, Share2, Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Bookmark } from '@/types/bookmark';

interface BookmarkDetailProps {
  bookmark: Bookmark;
}

export function BookmarkDetail({ bookmark }: BookmarkDetailProps) {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('return') || '/search';
  const { entry, user, tags, comment, description } = bookmark;
  const [copied, setCopied] = useState(false);
  
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/bookmarks/${bookmark.id}`
    : '';

  const handleShare = async () => {
    if (navigator.share && typeof window !== 'undefined') {
      try {
        await navigator.share({
          title: entry.title,
          text: entry.summary || '',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    if (typeof window !== 'undefined') {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {entry.title}
        </h1>
        <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {entry.domain}
            </a>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(bookmark.bookmarkedAt), 'yyyy/MM/dd HH:mm')}
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {user.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              title="Share bookmark"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Share
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {entry.summary && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            Summary
          </h2>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            {entry.summary}
          </p>
        </div>
      )}

      {/* Comment */}
      {comment && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            Comment
          </h2>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            {comment}
          </p>
        </div>
      )}

      {/* Description */}
      {description && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 uppercase tracking-wide">
            Description
          </h2>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            {description}
          </p>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide flex items-center gap-1">
            <Tag className="w-4 h-4" />
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Back to list */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href={returnUrl}
          className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          ← Back to bookmarks
        </Link>
      </div>
    </div>
  );
}