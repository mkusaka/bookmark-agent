'use client';

import { useState, ReactNode, createContext, useContext } from 'react';
import { BookmarkBulkActions } from './bookmark-bulk-actions';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Bookmark } from '@/types/bookmark';

interface SelectionContextType {
  selectedBookmarks: Set<string>;
  toggleBookmark: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within BookmarkListClient');
  }
  return context;
}

interface BookmarkListClientProps {
  bookmarks: Bookmark[];
  children: ReactNode;
}

export function BookmarkListClient({ bookmarks, children }: BookmarkListClientProps) {
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());

  const toggleBookmark = (id: string) => {
    setSelectedBookmarks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAll = (ids: string[]) => {
    setSelectedBookmarks(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) {
        return new Set();
      } else {
        return new Set(ids);
      }
    });
  };

  const clearSelection = () => {
    setSelectedBookmarks(new Set());
  };

  return (
    <SelectionContext.Provider value={{ selectedBookmarks, toggleBookmark, toggleAll, clearSelection }}>
      <TooltipProvider>
        <div className="flex flex-col gap-4">
          <BookmarkBulkActions 
            bookmarks={bookmarks} 
            selectedBookmarks={selectedBookmarks}
            onClearSelection={clearSelection}
          />
          {children}
        </div>
      </TooltipProvider>
    </SelectionContext.Provider>
  );
}