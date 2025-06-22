'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { BookmarkSearchV2 } from '@/components/bookmark-search/bookmark-search-v2';
import type { Bookmark, BookmarkFilters, BookmarkSort } from '@/types/bookmark';

interface BookmarkSearchWrapperProps {
  initialBookmarks: Bookmark[];
  domains: string[];
  tags: { id: string; label: string }[];
  users: { id: string; name: string; hatenaId: string }[];
  total: number;
  initialHasNextPage: boolean;
  initialHasPreviousPage: boolean;
  initialFilters: BookmarkFilters;
  initialSort: BookmarkSort;
  initialCursor?: string;
}

export function BookmarkSearchWrapper({
  initialBookmarks,
  domains,
  tags,
  users,
  total,
  initialHasNextPage,
  initialHasPreviousPage,
  initialFilters,
  initialSort,
  initialCursor,
}: BookmarkSearchWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  
  // State for optimistic updates
  const [bookmarks] = useState(initialBookmarks);
  const [hasNextPage] = useState(initialHasNextPage);
  const [hasPreviousPage] = useState(initialHasPreviousPage);

  // Update URL params
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const currentParams = new URLSearchParams(window.location.search);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });

    // Reset cursor when filters change
    if ('q' in updates || 'domains' in updates || 'tags' in updates || 'users' in updates || 'from' in updates || 'to' in updates) {
      currentParams.delete('cursor');
    }
    
    startTransition(() => {
      router.push(`${pathname}?${currentParams.toString()}`);
    });
  }, [pathname, router]);

  const handleFiltersChange = useCallback((newFilters: BookmarkFilters) => {
    updateSearchParams({
      q: newFilters.searchQuery || null,
      domains: newFilters.selectedDomains.length > 0 ? newFilters.selectedDomains.join(',') : null,
      tags: newFilters.selectedTags.length > 0 ? newFilters.selectedTags.join(',') : null,
      users: newFilters.selectedUsers.length > 0 ? newFilters.selectedUsers.join(',') : null,
      from: newFilters.dateRange?.from?.toISOString() || null,
      to: newFilters.dateRange?.to?.toISOString() || null,
    });
  }, [updateSearchParams]);

  const handleSortChange = useCallback((newSort: BookmarkSort) => {
    updateSearchParams({
      sortBy: newSort.field !== 'bookmarkedAt' ? newSort.field : null,
      order: newSort.order !== 'desc' ? newSort.order : null,
    });
  }, [updateSearchParams]);

  const handleNextPage = useCallback(() => {
    if (hasNextPage && bookmarks.length > 0) {
      const lastBookmark = bookmarks[bookmarks.length - 1];
      const nextCursor = `${lastBookmark.bookmarkedAt.toISOString()}_${lastBookmark.id}`;
      updateSearchParams({ cursor: nextCursor });
    }
  }, [hasNextPage, bookmarks, updateSearchParams]);

  const handlePreviousPage = useCallback(() => {
    // Simple implementation - go back to first page
    updateSearchParams({ cursor: null });
  }, [updateSearchParams]);

  return (
    <BookmarkSearchV2
      bookmarks={bookmarks}
      domains={domains}
      tags={tags}
      users={users}
      onFiltersChange={handleFiltersChange}
      onSortChange={handleSortChange}
      isLoading={isPending}
      total={total}
      hasNextPage={hasNextPage}
      hasPreviousPage={hasPreviousPage}
      onNextPage={handleNextPage}
      onPreviousPage={handlePreviousPage}
      initialFilters={initialFilters}
      initialSort={initialSort}
    />
  );
}