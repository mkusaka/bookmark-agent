import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ChevronsUpDown,
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

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return format(date, 'yyyy/MM/dd');
    }
  };


  return (
    <BookmarkListClient bookmarks={bookmarks}>
      <TooltipProvider>
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[50px]">
                  <SelectAllCheckbox 
                    bookmarkIds={bookmarks.map(b => b.id)} 
                    bookmarkCount={bookmarks.length}
                  />
                </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle font-medium">
                <Link href={`?sortBy=title&order=${currentSort.field === 'title' && currentSort.order === 'asc' ? 'desc' : 'asc'}`}>
                  <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent">
                    Bookmark{' '}
                    {currentSort.field === 'title' && `(${currentSort.order === 'desc' ? '↓' : '↑'})`}
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[140px]">
                <Link href={`?sortBy=user&order=${currentSort.field === 'user' && currentSort.order === 'asc' ? 'desc' : 'asc'}`}>
                  <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent">
                    User {currentSort.field === 'user' && `(${currentSort.order === 'desc' ? '↓' : '↑'})`}
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[120px]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent">
                      {currentSort.field === 'bookmarkedAt'
                        ? 'Bookmarked'
                        : currentSort.field === 'createdAt'
                        ? 'Created'
                        : 'Date'}
                      {(currentSort.field === 'bookmarkedAt' || currentSort.field === 'createdAt') &&
                        ` (${currentSort.order === 'desc' ? '↓' : '↑'})`}
                      <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`?sortBy=bookmarkedAt&order=${currentSort.order === 'asc' ? 'desc' : 'asc'}`}>
                        Sort by Bookmark Date
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`?sortBy=createdAt&order=${currentSort.order === 'asc' ? 'desc' : 'asc'}`}>
                        Sort by Created Date
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap"></TableHead>
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
                  <TableCell className="p-2 align-middle whitespace-nowrap">
                    <BookmarkCheckbox 
                      bookmarkId={bookmark.id} 
                    />
                  </TableCell>
                  <TableCell className="p-2 align-middle">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <div className="shrink-0">
                          <FilterLink
                            type="domains"
                            value={bookmark.domain}
                            label={bookmark.domain}
                            isSelected={currentFilters.domains.includes(bookmark.domain)}
                            currentParams={currentParams}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-medium text-sm truncate block flex-1">
                                  {bookmark.entry?.title || bookmark.url}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[600px]">
                                <p className="text-sm whitespace-pre-wrap break-words">{bookmark.entry?.title || bookmark.url}</p>
                              </TooltipContent>
                            </Tooltip>
                            <div className="flex gap-1 flex-wrap shrink-0">
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="text-xs cursor-help">
                                    +{bookmark.tags.length - 3}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="flex flex-wrap gap-1 max-w-[300px]">
                                    {bookmark.tags.slice(3).map((tag) => (
                                      <FilterLink
                                        key={tag.id}
                                        type="tags"
                                        value={tag.id}
                                        label={tag.label}
                                        isSelected={currentFilters.tags.includes(tag.id)}
                                        currentParams={currentParams}
                                      />
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {bookmark.entry?.summary && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm text-muted-foreground line-clamp-2 cursor-help">
                              {bookmark.entry.summary}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[600px]">
                            <p className="text-sm whitespace-pre-wrap">{bookmark.entry.summary}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {bookmark.comment && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm italic text-muted-foreground line-clamp-1 cursor-help">
                              &quot;{bookmark.comment}&quot;
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[400px]">
                            <p className="text-sm whitespace-pre-wrap">{bookmark.comment}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-2 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {bookmark.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-medium">{bookmark.user.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="p-2 align-middle whitespace-nowrap text-sm text-muted-foreground text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
                          {formatDate(
                            currentSort.field === 'bookmarkedAt' ? bookmark.bookmarkedAt : bookmark.createdAt
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          {format(
                            currentSort.field === 'bookmarkedAt' ? bookmark.bookmarkedAt : bookmark.createdAt,
                            'yyyy/MM/dd HH:mm:ss'
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="p-2 align-middle whitespace-nowrap">
                    <BookmarkActions url={bookmark.url} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex-1 text-sm text-muted-foreground">
          Showing {bookmarks.length} of {total} bookmark(s)
          </div>
          <div className="flex items-center gap-2">
            <Link href={hasPreviousPage ? '?' : '#'}>
              <Button
              variant="outline"
              size="sm"
              disabled={!hasPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          </Link>
          <Link href={hasNextPage ? `?cursor=${bookmarks[bookmarks.length - 1]?.bookmarkedAt.toISOString()}_${bookmarks[bookmarks.length - 1]?.id}` : '#'}>
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
      </TooltipProvider>
    </BookmarkListClient>
  );
}