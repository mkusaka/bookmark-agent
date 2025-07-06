'use client';

import { BookmarkBulkActions } from './bookmark-bulk-actions';
import { useSelection } from './search-page-client';
import type { Bookmark } from '@/types/bookmark';

interface BookmarkBulkActionsClientProps {
  bookmarks: Bookmark[];
}

export function BookmarkBulkActionsClient({ bookmarks }: BookmarkBulkActionsClientProps) {
  const { selectedBookmarks, clearSelection } = useSelection();
  
  return (
    <BookmarkBulkActions 
      bookmarks={bookmarks} 
      selectedBookmarks={selectedBookmarks}
      onClearSelection={clearSelection}
    />
  );
}