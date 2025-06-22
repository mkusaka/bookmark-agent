'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookmarkSearchV2 } from '@/components/bookmark-search/bookmark-search-v2';
import type { Bookmark, BookmarkFilters, BookmarkSort } from '@/types/bookmark';
import { searchFormSchema, type SearchFormValues, type SearchParams } from '@/lib/search-params-schema';

interface SearchWrapperRHFV2Props {
  initialBookmarks: Bookmark[];
  domains: string[];
  tags: { id: string; label: string }[];
  users: { id: string; name: string; hatenaId: string }[];
  total: number;
  initialHasNextPage: boolean;
  initialHasPreviousPage: boolean;
  initialValues: SearchParams;
}

export function SearchWrapperRHFV2({
  initialBookmarks,
  domains,
  tags,
  users,
  total,
  initialHasNextPage,
  initialHasPreviousPage,
  initialValues,
}: SearchWrapperRHFV2Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Initialize form with zod resolver
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
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

  const { getValues, setValue } = form;

  // Update URL based on current form values
  const updateURL = useCallback(() => {
    const values = getValues();
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
  }, [pathname, router, getValues]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: BookmarkFilters) => {
    // Batch updates to avoid multiple renders
    form.reset({
      q: newFilters.searchQuery,
      domains: newFilters.selectedDomains,
      tags: newFilters.selectedTags,
      users: newFilters.selectedUsers,
      from: newFilters.dateRange?.from,
      to: newFilters.dateRange?.to,
      sortBy: getValues('sortBy'),
      order: getValues('order'),
      cursor: undefined, // Reset cursor on filter change
    });
    
    // Update URL after form is updated
    setTimeout(() => updateURL(), 0);
  }, [form, getValues, updateURL]);

  // Handle sort change
  const handleSortChange = useCallback((newSort: BookmarkSort) => {
    setValue('sortBy', newSort.field);
    setValue('order', newSort.order);
    setValue('cursor', undefined); // Reset cursor on sort change
    updateURL();
  }, [setValue, updateURL]);

  // Handle pagination
  const handleNextPage = useCallback(() => {
    if (initialHasNextPage && initialBookmarks.length > 0) {
      const lastBookmark = initialBookmarks[initialBookmarks.length - 1];
      const nextCursor = `${lastBookmark.bookmarkedAt.toISOString()}_${lastBookmark.id}`;
      setValue('cursor', nextCursor);
      updateURL();
    }
  }, [initialHasNextPage, initialBookmarks, setValue, updateURL]);

  const handlePreviousPage = useCallback(() => {
    setValue('cursor', undefined);
    updateURL();
  }, [setValue, updateURL]);

  // Get current form values for component props
  const currentValues = getValues();
  
  const filters: BookmarkFilters = {
    searchQuery: currentValues.q,
    selectedDomains: currentValues.domains,
    selectedTags: currentValues.tags,
    selectedUsers: currentValues.users,
    dateRange: currentValues.from || currentValues.to ? {
      from: currentValues.from,
      to: currentValues.to,
    } : undefined,
  };

  const sort: BookmarkSort = {
    field: currentValues.sortBy,
    order: currentValues.order,
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
      hasPreviousPage={!!currentValues.cursor}
      onNextPage={handleNextPage}
      onPreviousPage={handlePreviousPage}
      initialFilters={filters}
      initialSort={sort}
    />
  );
}