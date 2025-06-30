export interface BookmarkTag {
  id: string;
  label: string;
}

export interface User {
  id: string;
  name: string;
  hatenaId: string;
}

export interface Entry {
  id: string;
  title: string;
  canonicalUrl: string;
  rootUrl: string;
  summary: string | null;
  domain: string;
  normalizedDomain: string;
}

export interface Bookmark {
  id: string;
  comment: string | null;
  description: string | null;
  url: string;
  domain: string;
  bookmarkedAt: Date;
  bookmarkUrl: string | null;
  markdownContent: string | null;
  markdownFetchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  entry: Entry;
  tags: BookmarkTag[];
}

export interface BookmarkFilters {
  searchQuery: string;
  selectedDomains: string[];
  selectedTags: string[];
  selectedUsers: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export type SortField = 'bookmarkedAt' | 'createdAt' | 'title' | 'user';
export type SortOrder = 'asc' | 'desc';

export interface BookmarkSort {
  field: SortField;
  order: SortOrder;
}

export interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
  previousCursor?: string;
}