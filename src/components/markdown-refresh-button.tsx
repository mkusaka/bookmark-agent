'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { refreshMarkdownContent } from '@/app/actions/markdown-actions';
import { useRouter } from 'next/navigation';

interface MarkdownRefreshButtonProps {
  bookmarkId: string;
  url: string;
}

export function MarkdownRefreshButton({ bookmarkId, url }: MarkdownRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshMarkdownContent(bookmarkId, url);
      if (result) {
        toast.success('Markdown content refreshed successfully');
        router.refresh();
      } else {
        toast.error('Failed to refresh markdown content');
      }
    } catch (error) {
      console.error('Error refreshing markdown:', error);
      toast.error('Failed to refresh markdown content');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="Refresh markdown content"
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}