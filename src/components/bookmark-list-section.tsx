import { getBookmarks } from '@/app/actions/bookmark-actions';
import { BookmarkList } from '@/components/bookmark-list';
import { BookmarkBulkActionsClient } from './bookmark-bulk-actions-client';
import type { BookmarkFilters, BookmarkSort } from '@/types/bookmark';

interface BookmarkListSectionProps {
  filters: BookmarkFilters;
  sort: BookmarkSort;
  cursor?: string;
  currentParams: { [key: string]: string | string[] | undefined };
}

export async function BookmarkListSection({
  filters,
  sort,
  cursor,
  currentParams,
}: BookmarkListSectionProps) {
  // Get bookmarks data
  const bookmarksData = await getBookmarks(filters, sort, 25, cursor);

  return (
    <>
      <BookmarkBulkActionsClient bookmarks={bookmarksData.bookmarks} />
      <BookmarkList
        bookmarks={bookmarksData.bookmarks}
        total={bookmarksData.total}
        hasNextPage={bookmarksData.pagination.hasNextPage}
        hasPreviousPage={bookmarksData.pagination.hasPreviousPage}
        currentSort={sort}
        currentFilters={{
          domains: filters.selectedDomains || [],
          tags: filters.selectedTags || [],
        }}
        currentParams={currentParams}
      />
    </>
  );
}