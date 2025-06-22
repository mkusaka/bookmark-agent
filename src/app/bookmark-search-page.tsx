'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookmarkSearch } from '@/components/bookmark-search';
import { getBookmarks, getDomains, getTags, getUsers } from './actions/bookmark-actions';
import type { Bookmark, BookmarkFilters, BookmarkSort } from '@/types/bookmark';
import { useDebounce } from '@/hooks/use-debounce';

export default function BookmarkSearchPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [tags, setTags] = useState<{ id: string; label: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; hatenaId: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { bookmarks: bookmarksData } = await getBookmarks(debouncedFilters, sort);
      setBookmarks(bookmarksData);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters, sort]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleFiltersChange = useCallback((newFilters: BookmarkFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((newSort: BookmarkSort) => {
    setSort(newSort);
  }, []);

  return (
    <BookmarkSearch
      bookmarks={bookmarks}
      domains={domains}
      tags={tags}
      users={users}
      onFiltersChange={handleFiltersChange}
      onSortChange={handleSortChange}
      isLoading={isLoading}
    />
  );
}