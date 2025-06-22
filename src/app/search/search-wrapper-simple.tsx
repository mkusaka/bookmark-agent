'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { BookmarkSearchV2 } from '@/components/bookmark-search/bookmark-search-v2';
import type { Bookmark, BookmarkFilters, BookmarkSort } from '@/types/bookmark';
import type { SearchParams } from '@/lib/search-params-schema';

interface SearchWrapperSimpleProps {
  initialBookmarks: Bookmark[];
  domains: string[];
  tags: { id: string; label: string }[];
  users: { id: string; name: string; hatenaId: string }[];
  total: number;
  initialHasNextPage: boolean;
  initialHasPreviousPage: boolean;
  initialValues: SearchParams;
}

export function SearchWrapperSimple({
  initialBookmarks,
  domains,
  tags,
  users,
  total,
  initialHasNextPage,
  initialHasPreviousPage,
  initialValues,
}: SearchWrapperSimpleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Simple state management - no complex forms
  const [bookmarks] = useState(initialBookmarks);
  const [hasNextPage] = useState(initialHasNextPage);
  const [hasPreviousPage] = useState(initialHasPreviousPage);

  // Update URL params
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset cursor when filters change
    if ('q' in updates || 'domains' in updates || 'tags' in updates || 'users' in updates || 'from' in updates || 'to' in updates) {
      params.delete('cursor');
    }
    
    router.push(`${pathname}?${params.toString()}`);
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
    updateSearchParams({ cursor: null });
  }, [updateSearchParams]);

  // Convert initial values to filters
  const filters: BookmarkFilters = {
    searchQuery: initialValues.q || '',
    selectedDomains: initialValues.domains,
    selectedTags: initialValues.tags,
    selectedUsers: initialValues.users,
    dateRange: initialValues.from || initialValues.to ? {
      from: initialValues.from,
      to: initialValues.to,
    } : undefined,
  };

  const sort: BookmarkSort = {
    field: initialValues.sortBy,
    order: initialValues.order,
  };

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
      hasPreviousPage={!!initialValues.cursor}
      onNextPage={handleNextPage}
      onPreviousPage={handlePreviousPage}
      initialFilters={filters}
      initialSort={sort}
    />
  );
}