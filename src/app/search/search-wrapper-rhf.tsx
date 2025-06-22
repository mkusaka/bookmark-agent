'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { BookmarkSearchV2 } from '@/components/bookmark-search/bookmark-search-v2';
import type { Bookmark, BookmarkFilters, BookmarkSort } from '@/types/bookmark';
import { type SearchFormValues, type SearchParams } from '@/lib/search-params-schema';

interface SearchWrapperRHFProps {
  initialBookmarks: Bookmark[];
  domains: string[];
  tags: { id: string; label: string }[];
  users: { id: string; name: string; hatenaId: string }[];
  total: number;
  initialHasNextPage: boolean;
  initialHasPreviousPage: boolean;
  initialValues: SearchParams;
}

export function SearchWrapperRHF({
  initialBookmarks,
  domains,
  tags,
  users,
  total,
  initialHasNextPage,
  initialHasPreviousPage,
  initialValues,
}: SearchWrapperRHFProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Initialize form with values from URL
  const form = useForm<SearchFormValues>({
    defaultValues: {
      q: initialValues.q || '',
      domains: initialValues.domains,
      tags: initialValues.tags,
      users: initialValues.users,
      from: initialValues.from,
      to: initialValues.to,
      sortBy: initialValues.sortBy,
      order: initialValues.order,
      cursor: initialValues.cursor,
    },
  });

  const { watch, setValue } = form;
  const formValues = watch();

  // Update URL when form values change
  const updateURL = useCallback((values: SearchFormValues) => {
    const params = new URLSearchParams();
    
    if (values.q) params.set('q', values.q);
    if (values.domains.length > 0) params.set('domains', values.domains.join(','));
    if (values.tags.length > 0) params.set('tags', values.tags.join(','));
    if (values.users.length > 0) params.set('users', values.users.join(','));
    if (values.from) params.set('from', values.from.toISOString());
    if (values.to) params.set('to', values.to.toISOString());
    if (values.sortBy !== 'bookmarkedAt') params.set('sortBy', values.sortBy);
    if (values.order !== 'desc') params.set('order', values.order);
    if (values.cursor) params.set('cursor', values.cursor);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [pathname, router]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: BookmarkFilters) => {
    setValue('q', newFilters.searchQuery);
    setValue('domains', newFilters.selectedDomains);
    setValue('tags', newFilters.selectedTags);
    setValue('users', newFilters.selectedUsers);
    setValue('from', newFilters.dateRange?.from);
    setValue('to', newFilters.dateRange?.to);
    setValue('cursor', undefined); // Reset cursor on filter change
    
    updateURL({
      ...formValues,
      q: newFilters.searchQuery,
      domains: newFilters.selectedDomains,
      tags: newFilters.selectedTags,
      users: newFilters.selectedUsers,
      from: newFilters.dateRange?.from,
      to: newFilters.dateRange?.to,
      cursor: undefined,
    });
  }, [formValues, setValue, updateURL]);

  // Handle sort change
  const handleSortChange = useCallback((newSort: BookmarkSort) => {
    setValue('sortBy', newSort.field);
    setValue('order', newSort.order);
    setValue('cursor', undefined); // Reset cursor on sort change
    
    updateURL({
      ...formValues,
      sortBy: newSort.field,
      order: newSort.order,
      cursor: undefined,
    });
  }, [formValues, setValue, updateURL]);

  // Handle pagination
  const handleNextPage = useCallback(() => {
    if (initialHasNextPage && initialBookmarks.length > 0) {
      const lastBookmark = initialBookmarks[initialBookmarks.length - 1];
      const nextCursor = `${lastBookmark.bookmarkedAt.toISOString()}_${lastBookmark.id}`;
      setValue('cursor', nextCursor);
      updateURL({ ...formValues, cursor: nextCursor });
    }
  }, [initialHasNextPage, initialBookmarks, formValues, setValue, updateURL]);

  const handlePreviousPage = useCallback(() => {
    setValue('cursor', undefined);
    updateURL({ ...formValues, cursor: undefined });
  }, [formValues, setValue, updateURL]);

  // Convert form values to filters for component
  const filters: BookmarkFilters = {
    searchQuery: formValues.q,
    selectedDomains: formValues.domains,
    selectedTags: formValues.tags,
    selectedUsers: formValues.users,
    dateRange: formValues.from || formValues.to ? {
      from: formValues.from,
      to: formValues.to,
    } : undefined,
  };

  const sort: BookmarkSort = {
    field: formValues.sortBy,
    order: formValues.order,
  };

  return (
    <BookmarkSearchV2
      bookmarks={initialBookmarks}
      domains={domains}
      tags={tags}
      users={users}
      onFiltersChange={handleFiltersChange}
      onSortChange={handleSortChange}
      isLoading={isPending}
      total={total}
      hasNextPage={initialHasNextPage}
      hasPreviousPage={!!formValues.cursor}
      onNextPage={handleNextPage}
      onPreviousPage={handlePreviousPage}
      initialFilters={filters}
      initialSort={sort}
    />
  );
}