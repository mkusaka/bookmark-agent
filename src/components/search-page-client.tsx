'use client';

import { ReactNode, useState, createContext, useContext } from 'react';
import { NavigationProvider } from '@/contexts/navigation-context';
import { FocusRefresher } from '@/components/focus-refresher';

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
    throw new Error('useSelection must be used within SearchPageClient');
  }
  return context;
}

interface SearchPageClientProps {
  children: ReactNode;
}

export function SearchPageClient({ children }: SearchPageClientProps) {
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
    <NavigationProvider>
      <SelectionContext.Provider value={{ selectedBookmarks, toggleBookmark, toggleAll, clearSelection }}>
        <FocusRefresher />
        {children}
      </SelectionContext.Provider>
    </NavigationProvider>
  );
}