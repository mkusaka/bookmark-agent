import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Bookmark } from '@/types/bookmark';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  BookmarkCheckbox, 
  SelectAllCheckbox, 
  BookmarkActions
} from './bookmark-list-actions';
import { BookmarkListClient } from './bookmark-list-client';
import { FilterLink } from './bookmark-filter-link';
import { BookmarkTitle } from './bookmark-title';
import { BookmarkSummary } from './bookmark-summary';
import { BookmarkDate } from './bookmark-date';
import { BookmarkExtraTags } from './bookmark-extra-tags';
import { BookmarkSortLink } from './bookmark-sort-link';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentSort: {
    field: string;
    order: string;
  };
  currentFilters: {
    domains: string[];
    tags: string[];
  };
  currentParams: { [key: string]: string | string[] | undefined };
}

export function BookmarkList({
  bookmarks,
  total,
  hasNextPage,
  hasPreviousPage,
  currentSort,
  currentFilters,
  currentParams,
}: BookmarkListProps) {
  // Helper to build URL with current params
  const buildUrlWithParams = (cursor?: string) => {
    const params = new URLSearchParams();
    
    // Copy all existing params
    Object.entries(currentParams).forEach(([key, val]) => {
      if (val && key !== 'cursor') {
        if (Array.isArray(val)) {
          val.forEach(v => params.append(key, v));
        } else {
          params.set(key, val);
        }
      }
    });
    
    // Add cursor if provided
    if (cursor) {
      params.set('cursor', cursor);
    }
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else if (diffInDays < 30) {
      return `${Math.floor(diffInDays / 7)}w ago`;
    } else if (diffInDays < 365) {
      return `${Math.floor(diffInDays / 30)}mo ago`;
    } else {
      return format(date, 'yyyy/MM/dd');
    }
  };


  return (
    <BookmarkListClient>
      <div className="rounded-md border">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[40px] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                  <SelectAllCheckbox 
                    bookmarkIds={bookmarks.map(b => b.id)} 
                    bookmarkCount={bookmarks.length}
                  />
                </TableHead>
                <TableHead className="h-10 px-2 text-left align-middle font-medium">
                <BookmarkSortLink
                  href={
                    currentSort.field === 'title'
                      ? currentSort.order === 'asc'
                        ? '?sortBy=title&order=desc'
                        : '?'  // Reset to default (no sort)
                      : '?sortBy=title&order=asc'
                  }
                  sortState={currentSort.field === 'title' ? currentSort.order as 'asc' | 'desc' : null}
                >
                  Bookmark
                </BookmarkSortLink>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[70px]">
                <BookmarkSortLink
                  href={
                    currentSort.field === 'bookmarkedAt'
                      ? currentSort.order === 'desc'
                        ? '?sortBy=bookmarkedAt&order=asc'
                        : '?'  // Reset to default (no sort)
                      : '?sortBy=bookmarkedAt&order=desc'
                  }
                  sortState={currentSort.field === 'bookmarkedAt' ? currentSort.order as 'asc' | 'desc' : null}
                >
                  Date
                </BookmarkSortLink>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookmarks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No bookmarks found
                </TableCell>
              </TableRow>
            ) : (
              bookmarks.map((bookmark) => (
                <TableRow key={bookmark.id}>
                  <TableCell className="p-2 align-middle whitespace-nowrap w-[40px] [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                    <BookmarkCheckbox 
                      bookmarkId={bookmark.id} 
                    />
                  </TableCell>
                  <TableCell className="p-2 align-middle">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                        <FilterLink
                          type="domains"
                          value={bookmark.entry.normalizedDomain || bookmark.entry.rootUrl}
                          label={(bookmark.entry.normalizedDomain || bookmark.entry.rootUrl).replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          isSelected={currentFilters.domains.includes(bookmark.entry.normalizedDomain || bookmark.entry.rootUrl)}
                          currentParams={currentParams}
                        />
                        <div className="flex-1 min-w-0">
                          <BookmarkTitle 
                            title={bookmark.entry.title} 
                            url={bookmark.url}
                            bookmarkId={bookmark.id}
                          />
                        </div>
                      </div>
                      {(bookmark.entry.summary || bookmark.comment || bookmark.tags.length > 0) && (
                        <div className="flex flex-col gap-1 min-w-0">
                          {(bookmark.entry.summary || bookmark.comment) && (
                            <BookmarkSummary 
                              summary={bookmark.entry.summary} 
                              comment={bookmark.comment} 
                            />
                          )}
                        {bookmark.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {bookmark.tags.slice(0, 3).map((tag) => (
                              <FilterLink
                                key={tag.id}
                                type="tags"
                                value={tag.id}
                                label={tag.label}
                                isSelected={currentFilters.tags.includes(tag.id)}
                                currentParams={currentParams}
                              />
                            ))}
                            {bookmark.tags.length > 3 && (
                              <BookmarkExtraTags
                                extraCount={bookmark.tags.length - 3}
                                extraTags={bookmark.tags.slice(3)}
                                selectedTags={currentFilters.tags}
                                currentParams={currentParams}
                              />
                            )}
                          </div>
                        )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-2 align-middle whitespace-nowrap text-sm text-muted-foreground">
                    <BookmarkDate 
                      date={bookmark.bookmarkedAt}
                      displayDate={formatDate(bookmark.bookmarkedAt)}
                    />
                  </TableCell>
                  <TableCell className="p-2 align-middle whitespace-nowrap">
                    <BookmarkActions url={bookmark.url} bookmarkId={bookmark.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex-1 text-sm text-muted-foreground">
          Showing {bookmarks.length} of {total} bookmark(s)
          </div>
          <div className="flex items-center gap-2">
            <Link href={hasPreviousPage ? buildUrlWithParams() : '#'}>
              <Button
              variant="outline"
              size="sm"
              disabled={!hasPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          </Link>
          <Link href={hasNextPage ? buildUrlWithParams(`${bookmarks[bookmarks.length - 1]?.bookmarkedAt.toISOString()}_${bookmarks[bookmarks.length - 1]?.id}`) : '#'}>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </BookmarkListClient>
  );
}
