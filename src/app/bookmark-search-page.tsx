'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookmarkSearchV2 as BookmarkSearch } from '@/components/bookmark-search/bookmark-search-v2';
import { getBookmarks, getDomains, getTags, getUsers } from './actions/bookmark-actions';
import type { Bookmark, BookmarkFilters, BookmarkSort } from '@/types/bookmark';
import { useDebounce } from '@/hooks/use-debounce';

export default function BookmarkSearchPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [tags, setTags] = useState<{ id: string; label: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; hatenaId: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [filters, setFilters] = useState<BookmarkFilters>({
    searchQuery: '',
    selectedDomains: [],
    selectedTags: [],
    selectedUsers: [],
  });
  const [sort, setSort] = useState<BookmarkSort>({
    field: 'bookmarkedAt',
    order: 'desc',
  });

  const debouncedFilters = useDebounce(filters, 500);

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

  // Load bookmarks based on filters
  const loadBookmarks = useCallback(async (newCursor?: string) => {
    setIsLoading(true);
    try {
      const { bookmarks: bookmarksData, total, pagination } = await getBookmarks(
        debouncedFilters, 
        sort,
        25,
        newCursor
      );
      setBookmarks(bookmarksData);
      setTotal(total);
      setHasNextPage(pagination.hasNextPage);
      setHasPreviousPage(pagination.hasPreviousPage);
      setCursor(pagination.nextCursor);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters, sort]);

  useEffect(() => {
    setCursor(undefined); // Reset cursor when filters change
    loadBookmarks();
  }, [loadBookmarks]);

  const handleFiltersChange = useCallback((newFilters: BookmarkFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((newSort: BookmarkSort) => {
    setSort(newSort);
  }, []);

  const handleNextPage = useCallback(() => {
    if (cursor && hasNextPage) {
      loadBookmarks(cursor);
    }
  }, [cursor, hasNextPage, loadBookmarks]);

  const handlePreviousPage = useCallback(() => {
    // In a real implementation, you'd maintain a stack of cursors
    // For now, we'll just reload from the beginning
    setCursor(undefined);
    loadBookmarks();
  }, [loadBookmarks]);

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