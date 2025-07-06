import { getBookmarks } from '@/app/actions/bookmark-actions';
import { BookmarkList } from '@/components/bookmark-list';
import type { BookmarkFilters, BookmarkSort } from '@/types/bookmark';

interface BookmarkListWrapperProps {
  filters: BookmarkFilters;
  sort: BookmarkSort;
  cursor?: string;
  currentFilters: {
    domains: string[];
    tags: string[];
  };
  currentParams: { [key: string]: string | string[] | undefined };
}

export async function BookmarkListWrapper({
  filters,
  sort,
  cursor,
  currentFilters,
  currentParams,
}: BookmarkListWrapperProps) {
  const bookmarksData = await getBookmarks(filters, sort, 25, cursor);

  return (
    <BookmarkList
      bookmarks={bookmarksData.bookmarks}
      total={bookmarksData.total}
      hasNextPage={bookmarksData.pagination.hasNextPage}
      hasPreviousPage={bookmarksData.pagination.hasPreviousPage}
      currentSort={sort}
      currentFilters={currentFilters}
      currentParams={currentParams}
    />
  );
}