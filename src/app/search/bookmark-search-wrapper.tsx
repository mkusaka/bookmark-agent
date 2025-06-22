'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition, useEffect } from 'react';
import { BookmarkSearchV2 } from '@/components/bookmark-search/bookmark-search-v2';
import type { Bookmark, BookmarkFilters, BookmarkSort } from '@/types/bookmark';
import { getBookmarks } from '../actions/bookmark-actions';

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
}: BookmarkSearchWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // State for dynamic updates
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [hasPreviousPage, setHasPreviousPage] = useState(initialHasPreviousPage);
  const [currentTotal, setCurrentTotal] = useState(total);
  
  // Track if we have a cursor in the URL
  const currentCursor = searchParams.get('cursor');

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
    // Go back to first page
    updateSearchParams({ cursor: null });
  }, [updateSearchParams]);

  // Update data when URL changes (for pagination)
  useEffect(() => {
    const loadData = async () => {
      const newCursor = searchParams.get('cursor');
      if (newCursor !== currentCursor) {
        setIsLoadingData(true);
        try {
          const result = await getBookmarks(
            initialFilters,
            initialSort,
            25,
            newCursor || undefined
          );
          setBookmarks(result.bookmarks);
          setHasNextPage(result.pagination.hasNextPage);
          setHasPreviousPage(result.pagination.hasPreviousPage);
          setCurrentTotal(result.total);
        } catch (error) {
          console.error('Failed to load bookmarks:', error);
        } finally {
          setIsLoadingData(false);
        }
      }
    };

    loadData();
  }, [searchParams, currentCursor, initialFilters, initialSort]);

  return (
    <BookmarkSearchV2
      bookmarks={bookmarks}
      domains={domains}
      tags={tags}
      users={users}
      onFiltersChange={handleFiltersChange}
      onSortChange={handleSortChange}
      isLoading={isPending || isLoadingData}
      total={currentTotal}
      hasNextPage={hasNextPage}
      hasPreviousPage={!!currentCursor}
      onNextPage={handleNextPage}
      onPreviousPage={handlePreviousPage}
      initialFilters={initialFilters}
      initialSort={initialSort}
    />
  );
}