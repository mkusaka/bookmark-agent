'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BookmarkSearchV2 as BookmarkSearch } from '@/components/bookmark-search/bookmark-search-v2';
import { getBookmarks, getDomains, getTags, getUsers } from '../actions/bookmark-actions';
import type { Bookmark, BookmarkFilters, BookmarkSort } from '@/types/bookmark';

export default function BookmarkSearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [tags, setTags] = useState<{ id: string; label: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; hatenaId: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Parse filters from URL params
  const filters = useMemo<BookmarkFilters>(() => ({
    searchQuery: searchParams.get('q') || '',
    selectedDomains: searchParams.get('domains')?.split(',').filter(Boolean) || [],
    selectedTags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    selectedUsers: searchParams.get('users')?.split(',').filter(Boolean) || [],
    dateRange: searchParams.get('from') || searchParams.get('to') ? {
      from: searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined,
      to: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
    } : undefined,
  }), [searchParams]);

  // Parse sort from URL params
  const sort = useMemo<BookmarkSort>(() => ({
    field: (searchParams.get('sortBy') as any) || 'bookmarkedAt',
    order: (searchParams.get('order') as any) || 'desc',
  }), [searchParams]);

  const cursor = searchParams.get('cursor') || undefined;

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [domainsData, tagsData, usersData] = await Promise.all([
          getDomains(),
          getTags(),
          getUsers(),
        ]);
        setDomains(domainsData);
        setTags(tagsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };
    loadInitialData();
  }, []);

  // Load bookmarks based on URL params
  useEffect(() => {
    const loadBookmarks = async () => {
      setIsLoading(true);
      try {
        const { bookmarks: bookmarksData, total, pagination } = await getBookmarks(
          filters, 
          sort,
          25,
          cursor
        );
        setBookmarks(bookmarksData);
        setTotal(total);
        setHasNextPage(pagination.hasNextPage);
        setHasPreviousPage(pagination.hasPreviousPage);
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBookmarks();
  }, [filters, sort, cursor]);

  // Update URL params
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    
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
  }, [pathname, router, searchParams]);

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
    <BookmarkSearch
      bookmarks={bookmarks}
      domains={domains}
      tags={tags}
      users={users}
      onFiltersChange={handleFiltersChange}
      onSortChange={handleSortChange}
      isLoading={isLoading}
      total={total}
      hasNextPage={hasNextPage}
      hasPreviousPage={hasPreviousPage}
      onNextPage={handleNextPage}
      onPreviousPage={handlePreviousPage}
    />
  );
}