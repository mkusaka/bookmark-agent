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
  CirclePlus,
  ChevronsUpDown,
  ExternalLink,
  X,
  Settings2,
  BookmarkIcon,
  CalendarIcon,
  ExternalLinkIcon,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
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
}

export function BookmarkSearch({
  bookmarks,
  domains,
  tags,
  users,
  onFiltersChange,
  onSortChange,
  onAddBookmark,
  isLoading = false,
}: BookmarkSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [domainSearchQuery, setDomainSearchQuery] = useState("");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("bookmarkedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
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
      return `${diffInHours}時間前`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}日前`;
    } else {
      return format(date, "yyyy/MM/dd", { locale: ja });
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
                    placeholder="ドメインを検索..."
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
                        ドメインが見つかりません
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
                  タグ
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  {selectedTags.length > 0 && (
                    <>
                      <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                        {selectedTags.length}
                      </Badge>
                      <div className="hidden gap-1 lg:flex">
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                          {selectedTags.length} 選択中
                        </Badge>
                      </div>
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="start">
                <div className="p-3">
                  <Input
                    placeholder="タグを検索..."
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
                        タグが見つかりません
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
                  ユーザー
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  {selectedUsers.length > 0 && (
                    <>
                      <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                        {selectedUsers.length}
                      </Badge>
                      <div className="hidden gap-1 lg:flex">
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                          {selectedUsers.length} 選択中
                        </Badge>
                      </div>
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <div className="p-3">
                  <Input
                    placeholder="ユーザーを検索..."
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
                        ユーザーが見つかりません
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
                  作成日
                  {dateRange?.from && (
                    <>
                      <Separator orientation="vertical" className="mx-2 h-4" />
                      <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                        {dateRange.to ? "範囲" : "From"}
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
                  locale={ja}
                />
                {dateRange?.from && (
                  <div className="p-3 border-t">
                    <div className="text-sm">
                      <strong>選択:</strong>{" "}
                      {dateRange.from ? format(dateRange.from, "yyyy年MM月dd日", { locale: ja }) : ""}
                      {dateRange.to
                        ? ` - ${format(dateRange.to, "yyyy年MM月dd日", { locale: ja })}`
                        : ""}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setDateRange(undefined)}
                    >
                      クリア
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
                リセット
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto hidden h-8 lg:flex">
                  <Settings2 className="mr-2 h-4 w-4" />
                  {sortField === "bookmarkedAt"
                    ? "ブックマーク日"
                    : sortField === "createdAt"
                    ? "作成日"
                    : sortField === "title"
                    ? "タイトル"
                    : "ユーザー"}
                  でソート
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSortChange("bookmarkedAt")}>
                  ブックマーク日でソート
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("createdAt")}>
                  作成日でソート
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("title")}>
                  タイトルでソート
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange("user")}>
                  ユーザーでソート
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedBookmarks.length === bookmarks.length && bookmarks.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="すべて選択"
                  />
                </TableHead>
                <TableHead>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent">
                        ブックマーク{" "}
                        {sortField === "title" && `(${sortOrder === "desc" ? "↓" : "↑"})`}
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleSortChange("title")}>
                        タイトルでソート
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
                <TableHead>タグ</TableHead>
                <TableHead>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent">
                        ユーザー {sortField === "user" && `(${sortOrder === "desc" ? "↓" : "↑"})`}
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleSortChange("user")}>
                        ユーザーでソート
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
                <TableHead>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="-ml-3 h-8 data-[state=open]:bg-accent">
                        {sortField === "bookmarkedAt"
                          ? "ブックマーク日"
                          : sortField === "createdAt"
                          ? "作成日"
                          : "日付"}
                        {(sortField === "bookmarkedAt" || sortField === "createdAt") &&
                          `(${sortOrder === "desc" ? "↓" : "↑"})`}
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleSortChange("bookmarkedAt")}>
                        ブックマーク日でソート
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("createdAt")}>
                        作成日でソート
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : bookmarks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    ブックマークが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                bookmarks.map((bookmark) => (
                  <TableRow key={bookmark.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBookmarks.includes(bookmark.id)}
                        onCheckedChange={() => handleBookmarkToggle(bookmark.id)}
                        aria-label="行を選択"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2 items-center">
                          <Badge variant="outline" className="font-mono text-xs">
                            {bookmark.domain}
                          </Badge>
                          <span className="font-medium max-w-[400px] truncate">
                            {bookmark.entry?.title || bookmark.url}
                          </span>
                        </div>
                        {bookmark.comment && (
                          <div className="text-sm text-muted-foreground max-w-[400px] truncate">
                            {bookmark.comment}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap max-w-[200px]">
                        {bookmark.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.label}
                          </Badge>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{bookmark.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {bookmark.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm font-medium">{bookmark.user.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(
                        sortField === "bookmarkedAt" ? bookmark.bookmarkedAt : bookmark.createdAt
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(bookmark.url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">ブックマークを開く</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedBookmarks.length} / {bookmarks.length} 件のブックマークを選択中
          </div>
        </div>
      </div>
    </div>
  );
}