"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  CirclePlus,
  ChevronsUpDown,
  ExternalLink,
  X,
  Settings2,
  BookmarkIcon,
  CalendarIcon,
  ExternalLinkIcon,
  MoreHorizontal,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  type Bookmark,
  type BookmarkFilters,
  type BookmarkSort,
  type SortField,
} from "@/types/bookmark";

interface BookmarkSearchProps {
  bookmarks: Bookmark[];
  domains: string[];
  tags: { id: string; label: string }[];
  users: { id: string; name: string; hatenaId: string }[];
  onFiltersChange?: (filters: BookmarkFilters) => void;
  onSortChange?: (sort: BookmarkSort) => void;
  onAddBookmark?: () => void;
  isLoading?: boolean;
  total?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  initialFilters?: BookmarkFilters;
  initialSort?: BookmarkSort;
}

export function BookmarkSearchV2({
  bookmarks,
  domains,
  tags,
  users,
  onFiltersChange,
  onSortChange,
  onAddBookmark,
  isLoading = false,
  total = 0,
  hasNextPage = false,
  hasPreviousPage = false,
  onNextPage,
  onPreviousPage,
  initialFilters,
  initialSort,
}: BookmarkSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters?.searchQuery || "");
  const [selectedDomains, setSelectedDomains] = useState<string[]>(initialFilters?.selectedDomains || []);
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters?.selectedTags || []);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(initialFilters?.selectedUsers || []);
  const [domainSearchQuery, setDomainSearchQuery] = useState("");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(initialSort?.field || "bookmarkedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSort?.order || "desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialFilters?.dateRange ? {
      from: initialFilters.dateRange.from,
      to: initialFilters.dateRange.to,
    } : undefined
  );
  const isFirstRender = useRef(true);

  // Filter domains, tags, and users based on search
  const filteredDomains = useMemo(() => {
    return domains.filter((domain) =>
      domain.toLowerCase().includes(domainSearchQuery.toLowerCase())
    );
  }, [domains, domainSearchQuery]);

  const filteredTags = useMemo(() => {
    return tags.filter((tag) =>
      tag.label.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );
  }, [tags, tagSearchQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.hatenaId.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  }, [users, userSearchQuery]);

  const handleDomainToggle = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleBookmarkToggle = (bookmarkId: string) => {
    setSelectedBookmarks((prev) =>
      prev.includes(bookmarkId)
        ? prev.filter((id) => id !== bookmarkId)
        : [...prev, bookmarkId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBookmarks.length === bookmarks.length) {
      setSelectedBookmarks([]);
    } else {
      setSelectedBookmarks(bookmarks.map((b) => b.id));
    }
  };

  const handleOpenSelected = () => {
    const selectedBookmarkData = bookmarks.filter((bookmark) =>
      selectedBookmarks.includes(bookmark.id)
    );
    selectedBookmarkData.forEach((bookmark) => {
      window.open(bookmark.url, "_blank");
    });
  };

  const handleSortChange = (field: SortField) => {
    let newOrder = sortOrder;
    if (field === sortField) {
      newOrder = sortOrder === "desc" ? "asc" : "desc";
      setSortOrder(newOrder);
    } else {
      setSortField(field);
      newOrder = "desc";
      setSortOrder(newOrder);
    }
    onSortChange?.({ field, order: newOrder });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDomains([]);
    setSelectedTags([]);
    setSelectedUsers([]);
    setDomainSearchQuery("");
    setTagSearchQuery("");
    setUserSearchQuery("");
    setSortField("bookmarkedAt");
    setSortOrder("desc");
    setDateRange(undefined);
  };

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
      return format(date, "yyyy/MM/dd");
    }
  };

  // Notify parent of filter changes
  useEffect(() => {
    // Skip the first render to avoid initial call
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    onFiltersChange?.({
      searchQuery,
      selectedDomains,
      selectedTags,
      selectedUsers,
      dateRange: dateRange
        ? {
            from: dateRange.from,
            to: dateRange.to,
          }
        : undefined,
    });
  }, [
    searchQuery,
    selectedDomains,
    selectedTags,
    selectedUsers,
    dateRange,
    onFiltersChange,
  ]);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-8 p-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold tracking-tight">Bookmark Search</h2>
            <p className="text-muted-foreground">
              Search and manage bookmarks with advanced filtering
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedBookmarks.length > 0 && (
              <Button variant="outline" onClick={handleOpenSelected} className="gap-2">
                <ExternalLinkIcon className="h-4 w-4" />
                Open Selected ({selectedBookmarks.length})
              </Button>
            )}
            {onAddBookmark && (
              <Button className="gap-2" onClick={onAddBookmark}>
                <BookmarkIcon className="h-4 w-4" />
                Add Bookmark
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-2 flex-wrap">
              <Input
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-[150px] lg:w-[250px]"
              />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 border-dashed gap-1.5">
                    <CirclePlus className="h-4 w-4" />
                    Domain
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    {selectedDomains.length > 0 && (
                      <>
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                          {selectedDomains.length}
                        </Badge>
                        <div className="hidden gap-1 lg:flex">
                          <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                            {selectedDomains.length} selected
                          </Badge>
                        </div>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <div className="p-3">
                    <Input
                      placeholder="Search domains..."
                      value={domainSearchQuery}
                      onChange={(e) => setDomainSearchQuery(e.target.value)}
                      className="h-8 mb-2"
                    />
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredDomains.map((domain) => (
                        <div
                          key={domain}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm"
                        >
                          <Checkbox
                            id={domain}
                            checked={selectedDomains.includes(domain)}
                            onCheckedChange={() => handleDomainToggle(domain)}
                          />
                          <label
                            htmlFor={domain}
                            className="text-sm font-medium cursor-pointer flex-1"
                          >
                            {domain}
                          </label>
                        </div>
                      ))}
                      {filteredDomains.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          No domains found
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 border-dashed gap-1.5">
                    <CirclePlus className="h-4 w-4" />
                    Tags
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    {selectedTags.length > 0 && (
                      <>
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                          {selectedTags.length}
                        </Badge>
                        <div className="hidden gap-1 lg:flex">
                          <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                            {selectedTags.length} selected
                          </Badge>
                        </div>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <div className="p-3">
                    <Input
                      placeholder="Search tags..."
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      className="h-8 mb-2"
                    />
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredTags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm"
                        >
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={selectedTags.includes(tag.id)}
                            onCheckedChange={() => handleTagToggle(tag.id)}
                          />
                          <label
                            htmlFor={`tag-${tag.id}`}
                            className="text-sm font-medium cursor-pointer flex-1"
                          >
                            {tag.label}
                          </label>
                        </div>
                      ))}
                      {filteredTags.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          No tags found
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 border-dashed gap-1.5">
                    <CirclePlus className="h-4 w-4" />
                    Users
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    {selectedUsers.length > 0 && (
                      <>
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                          {selectedUsers.length}
                        </Badge>
                        <div className="hidden gap-1 lg:flex">
                          <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                            {selectedUsers.length} selected
                          </Badge>
                        </div>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <div className="p-3">
                    <Input
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="h-8 mb-2"
                    />
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm"
                        >
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => handleUserToggle(user.id)}
                          />
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">@{user.hatenaId}</div>
                          </div>
                        </div>
                      ))}
                      {filteredUsers.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          No users found
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 border-dashed gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    Date
                    {dateRange?.from && (
                      <>
                        <Separator orientation="vertical" className="mx-2 h-4" />
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                          {dateRange.to ? "Range" : "From"}
                        </Badge>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                  {dateRange?.from && (
                    <div className="p-3 border-t">
                      <div className="text-sm">
                        <strong>Selected:</strong>{" "}
                        {dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : ""}
                        {dateRange.to
                          ? ` - ${format(dateRange.to, "MMM dd, yyyy")}`
                          : ""}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => setDateRange(undefined)}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {(searchQuery ||
                selectedDomains.length > 0 ||
                selectedTags.length > 0 ||
                selectedUsers.length > 0 ||
                dateRange) && (
                <Button variant="ghost" onClick={resetFilters} className="h-8 px-2 lg:px-3">
                  Reset
                  <X className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto hidden h-8 lg:flex">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Sort by{" "}
                    {sortField === "bookmarkedAt"
                      ? "Date"
                      : sortField === "createdAt"
                      ? "Created"
                      : sortField === "title"
                      ? "Title"
                      : "User"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSortChange("bookmarkedAt")}>
                    Sort by Bookmark Date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange("createdAt")}>
                    Sort by Created Date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange("title")}>
                    Sort by Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange("user")}>
                    Sort by User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap">
                    <Checkbox
                      checked={
                        selectedBookmarks.length === bookmarks.length && bookmarks.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className="translate-y-[2px]"
                    />
                  </TableHead>
                  <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent">
                          Bookmark{" "}
                          {sortField === "title" && `(${sortOrder === "desc" ? "↓" : "↑"})`}
                          <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => handleSortChange("title")}>
                          Sort by Title
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableHead>
                  <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[140px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent">
                          User {sortField === "user" && `(${sortOrder === "desc" ? "↓" : "↑"})`}
                          <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSortChange("user")}>
                          Sort by User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableHead>
                  <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap w-[120px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent">
                          {sortField === "bookmarkedAt"
                            ? "Bookmarked"
                            : sortField === "createdAt"
                            ? "Created"
                            : "Date"}
                          {(sortField === "bookmarkedAt" || sortField === "createdAt") &&
                            `(${sortOrder === "desc" ? "↓" : "↑"})`}
                          <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSortChange("bookmarkedAt")}>
                          Sort by Bookmark Date
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSortChange("createdAt")}>
                          Sort by Created Date
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableHead>
                  <TableHead className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      <div className="flex items-center justify-center">
                        <div className="text-sm text-muted-foreground">Loading...</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : bookmarks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No bookmarks found
                    </TableCell>
                  </TableRow>
                ) : (
                  bookmarks.map((bookmark) => (
                    <TableRow key={bookmark.id}>
                      <TableCell className="p-2 align-middle whitespace-nowrap">
                        <Checkbox
                          checked={selectedBookmarks.includes(bookmark.id)}
                          onCheckedChange={() => handleBookmarkToggle(bookmark.id)}
                          aria-label="Select row"
                          className="translate-y-[2px]"
                        />
                      </TableCell>
                      <TableCell className="p-2 align-middle max-w-[500px]">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <Badge 
                              variant={selectedDomains.includes(bookmark.domain) ? "default" : "outline"}
                              className="font-mono text-xs shrink-0 cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => {
                                if (selectedDomains.includes(bookmark.domain)) {
                                  setSelectedDomains(selectedDomains.filter(d => d !== bookmark.domain));
                                } else {
                                  setSelectedDomains([...selectedDomains, bookmark.domain]);
                                }
                              }}
                            >
                              {bookmark.domain}
                            </Badge>
                            <div className="flex-1 min-w-0 flex items-start gap-2">
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
                                  <Badge 
                                    key={tag.id} 
                                    variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
                                    className="text-xs cursor-pointer hover:bg-accent transition-colors"
                                    onClick={() => {
                                      if (selectedTags.includes(tag.id)) {
                                        setSelectedTags(selectedTags.filter(t => t !== tag.id));
                                      } else {
                                        setSelectedTags([...selectedTags, tag.id]);
                                      }
                                    }}
                                  >
                                    {tag.label}
                                  </Badge>
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
                                          <Badge 
                                            key={tag.id} 
                                            variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
                                            className="text-xs cursor-pointer hover:bg-accent transition-colors"
                                            onClick={() => {
                                              if (selectedTags.includes(tag.id)) {
                                                setSelectedTags(selectedTags.filter(t => t !== tag.id));
                                              } else {
                                                setSelectedTags([...selectedTags, tag.id]);
                                              }
                                            }}
                                          >
                                            {tag.label}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
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
                                sortField === "bookmarkedAt" ? bookmark.bookmarkedAt : bookmark.createdAt
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {format(
                                sortField === "bookmarkedAt" ? bookmark.bookmarkedAt : bookmark.createdAt,
                                "yyyy/MM/dd HH:mm:ss"
                              )}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="p-2 align-middle whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(bookmark.url, "_blank")}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open in new tab
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(bookmark.url)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex-1 text-sm text-muted-foreground">
              {selectedBookmarks.length} of {bookmarks.length} bookmark(s) selected.
              {total > 0 && ` (${total} total)`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousPage}
                disabled={!hasPreviousPage || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextPage}
                disabled={!hasNextPage || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}