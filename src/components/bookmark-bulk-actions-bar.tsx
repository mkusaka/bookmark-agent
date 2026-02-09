'use client';

import { BookmarkBulkActions } from './bookmark-bulk-actions';
import { useSelection } from './search-page-client';

interface BookmarkBulkActionsBarProps {
  bookmarks: Array<{ id: string; url: string }>;
}

export function BookmarkBulkActionsBar({ bookmarks }: BookmarkBulkActionsBarProps) {
  const { selectedBookmarks, clearSelection } = useSelection();

  return (
    <BookmarkBulkActions
      bookmarks={bookmarks}
      selectedBookmarks={selectedBookmarks}
      onClearSelection={clearSelection}
    />
  );
}
