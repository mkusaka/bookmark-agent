import { getBookmarks } from '@/app/actions/bookmark-actions';
import { BookmarkBulkActionsClient } from './bookmark-bulk-actions-client';
import type { BookmarkFilters, BookmarkSort } from '@/types/bookmark';

interface BookmarkBulkActionsWrapperProps {
  filters: BookmarkFilters;
  sort: BookmarkSort;
  cursor?: string;
}

export async function BookmarkBulkActionsWrapper({
  filters,
  sort,
  cursor,
}: BookmarkBulkActionsWrapperProps) {
  const bookmarksData = await getBookmarks(filters, sort, 25, cursor);

  return (
    <BookmarkBulkActionsClient bookmarks={bookmarksData.bookmarks} />
  );
}