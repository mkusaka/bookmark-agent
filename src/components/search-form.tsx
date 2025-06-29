'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useTransition, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
  CirclePlus,
  X,
  CalendarIcon,
  Loader2,
} from 'lucide-react';
import { type SearchFormValues } from '@/lib/search-params-schema';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { fuzzyMatch } from '@/lib/fuzzy-match';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigationPending } from '@/contexts/navigation-context';
import { BookmarkBulkActions } from './bookmark-bulk-actions';
import { useSelection } from './search-page-client';
import type { Bookmark } from '@/types/bookmark';

interface SearchFormProps {
  domains: string[];
  tags: { id: string; label: string }[];
  bookmarks: Bookmark[];
  initialValues: SearchFormValues;
}

export function SearchForm({
  domains,
  tags,
  bookmarks,
  initialValues,
}: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { isPending: isNavigationPending, setIsPending } = useNavigationPending();
  const { selectedBookmarks, clearSelection } = useSelection();
  
  useEffect(() => {
    setIsPending(isPending);
  }, [isPending, setIsPending]);

  const form = useForm<SearchFormValues>({
    defaultValues: initialValues,
    values: initialValues, // Always sync with props
  });

  const { register, watch, setValue, reset } = form;
  const formValues = watch();

  // Update URL when form changes
  const updateURL = useCallback(() => {
    const values = form.getValues();
    const params = new URLSearchParams();
    
    if (values.q) params.set('q', values.q);
    
    // Add array parameters properly
    values.domains.forEach(domain => params.append('domains', domain));
    values.tags.forEach(tag => params.append('tags', tag));
    
    if (values.from) params.set('from', values.from.toISOString());
    if (values.to) params.set('to', values.to.toISOString());
    if (values.sortBy !== 'bookmarkedAt') params.set('sortBy', values.sortBy);
    if (values.order !== 'desc') params.set('order', values.order);
    // Don't include cursor - reset pagination on filter change

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [form, pathname, router]);

  const handleDomainToggle = useCallback((domain: string) => {
    const current = form.getValues('domains');
    if (current.includes(domain)) {
      setValue('domains', current.filter(d => d !== domain));
    } else {
      setValue('domains', [...current, domain]);
    }
    updateURL();
  }, [form, setValue, updateURL]);

  const handleTagToggle = useCallback((tagId: string) => {
    const current = form.getValues('tags');
    if (current.includes(tagId)) {
      setValue('tags', current.filter(t => t !== tagId));
    } else {
      setValue('tags', [...current, tagId]);
    }
    updateURL();
  }, [form, setValue, updateURL]);


  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setValue('from', range?.from);
    setValue('to', range?.to);
    updateURL();
  }, [setValue, updateURL]);

  const resetFilters = useCallback(() => {
    reset({
      q: '',
      domains: [],
      tags: [],
      from: undefined,
      to: undefined,
      sortBy: 'bookmarkedAt',
      order: 'desc',
      cursor: undefined,
    });
    updateURL();
  }, [reset, updateURL]);

  const dateRange: DateRange | undefined = formValues.from || formValues.to ? {
    from: formValues.from,
    to: formValues.to,
  } : undefined;

  return (
    <div className="flex flex-1 items-center gap-2 flex-wrap">
      <Input
        placeholder="Search bookmarks..."
        {...register('q')}
        onChange={(e) => {
          setValue('q', e.target.value);
          updateURL();
        }}
        className="h-8 w-[150px] lg:w-[250px]"
      />

      {/* Domain Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 border-dashed gap-1.5">
            <CirclePlus className="h-4 w-4" />
            Domain
            <Separator orientation="vertical" className="mx-2 h-4" />
            {formValues.domains.length > 0 && (
              <>
                <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                  {formValues.domains.length}
                </Badge>
                <div className="hidden gap-1 lg:flex">
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {formValues.domains.length} selected
                  </Badge>
                </div>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <DomainSelector
            domains={domains}
            selectedDomains={formValues.domains}
            onToggle={handleDomainToggle}
          />
        </PopoverContent>
      </Popover>

      {/* Tags Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 border-dashed gap-1.5">
            <CirclePlus className="h-4 w-4" />
            Tags
            <Separator orientation="vertical" className="mx-2 h-4" />
            {formValues.tags.length > 0 && (
              <>
                <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                  {formValues.tags.length}
                </Badge>
                <div className="hidden gap-1 lg:flex">
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {formValues.tags.length} selected
                  </Badge>
                </div>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <TagSelector
            tags={tags}
            selectedTags={formValues.tags}
            onToggle={handleTagToggle}
          />
        </PopoverContent>
      </Popover>


      {/* Date Filter */}
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
            onSelect={handleDateRangeChange}
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
                onClick={() => handleDateRangeChange(undefined)}
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Reset button */}
      {(formValues.q ||
        formValues.domains.length > 0 ||
        formValues.tags.length > 0 ||
        dateRange ||
        formValues.sortBy !== 'bookmarkedAt' ||
        formValues.order !== 'desc' ||
        formValues.cursor) && (
        <Button variant="ghost" onClick={resetFilters} className="h-8 px-2 lg:px-3">
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
      
      {/* Loading indicator */}
      {(isPending || isNavigationPending) && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      )}
      
      {/* Bulk Actions */}
      <BookmarkBulkActions 
        bookmarks={bookmarks} 
        selectedBookmarks={selectedBookmarks}
        onClearSelection={clearSelection}
      />
    </div>
  );
}

// Domain Selector Component
function DomainSelector({ 
  domains, 
  selectedDomains, 
  onToggle 
}: { 
  domains: string[]; 
  selectedDomains: string[]; 
  onToggle: (domain: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  
  const filteredDomains = searchQuery
    ? domains.filter(domain => fuzzyMatch(searchQuery, domain))
    : domains;

  // Sort domains: selected first, then alphabetically by domain without schema
  const sortedDomains = [...filteredDomains].sort((a, b) => {
    const aSelected = selectedDomains.includes(a);
    const bSelected = selectedDomains.includes(b);
    
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return a.localeCompare(b);
  });

  // Initialize virtualizer with dynamic height
  const rowVirtualizer = useVirtualizer({
    count: sortedDomains.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Default height
    overscan: 5,
    measureElement: (element) => element?.getBoundingClientRect().height ?? 40,
  });

  // Reset focused index when sorted domains change
  useEffect(() => {
    setFocusedIndex(0);
  }, [sortedDomains.length]);

  // Scroll to focused item
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < sortedDomains.length) {
      rowVirtualizer.scrollToIndex(focusedIndex, { align: 'auto' });
    }
  }, [focusedIndex, rowVirtualizer, sortedDomains.length]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => 
          prev < sortedDomains.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (sortedDomains[focusedIndex]) {
          onToggle(sortedDomains[focusedIndex]);
        }
        break;
    }
  };

  return (
    <div className="p-3">
      <Input
        ref={inputRef}
        placeholder="Search domains..."
        className="h-8 mb-2"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      {sortedDomains.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-2">
          No domains found
        </div>
      ) : (
        <div
          ref={parentRef}
          className="max-h-[300px] overflow-auto"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const domain = sortedDomains[virtualItem.index];
              const isSelected = selectedDomains.includes(domain);
              const isFocused = virtualItem.index === focusedIndex;

              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div
                    className={`flex items-center space-x-2 px-3 py-2 rounded-sm cursor-pointer ${
                      isFocused ? 'bg-accent' : 'hover:bg-accent'
                    }`}
                    onClick={() => onToggle(domain)}
                    onMouseEnter={() => setFocusedIndex(virtualItem.index)}
                  >
                    <Checkbox
                      id={`domain-${virtualItem.index}`}
                      checked={isSelected}
                      className="pointer-events-none shrink-0 mt-0.5"
                    />
                    <label
                      htmlFor={`domain-${virtualItem.index}`}
                      className="text-sm font-medium flex-1 pointer-events-none break-all py-0.5"
                    >
                      {domain}
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Tag Selector Component
function TagSelector({ 
  tags, 
  selectedTags, 
  onToggle 
}: { 
  tags: { id: string; label: string }[]; 
  selectedTags: string[]; 
  onToggle: (tagId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const filteredTags = searchQuery
    ? tags.filter(tag => fuzzyMatch(searchQuery, tag.label))
    : tags;

  // Sort tags: selected first, then alphabetically by label
  const sortedTags = [...filteredTags].sort((a, b) => {
    const aSelected = selectedTags.includes(a.id);
    const bSelected = selectedTags.includes(b.id);
    
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return a.label.localeCompare(b.label);
  });

  // Reset focused index when sorted tags change
  useEffect(() => {
    setFocusedIndex(0);
  }, [sortedTags.length]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => 
          prev < sortedTags.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (sortedTags[focusedIndex]) {
          onToggle(sortedTags[focusedIndex].id);
        }
        break;
    }
  };

  return (
    <div className="p-3">
      <Input
        ref={inputRef}
        placeholder="Search tags..."
        className="h-8 mb-2"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <div className="max-h-[200px] overflow-y-auto">
        {sortedTags.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-2">
            No tags found
          </div>
        ) : (
          sortedTags.map((tag, index) => (
            <div
              key={tag.id}
              className={`flex items-center space-x-2 p-2 rounded-sm cursor-pointer ${
                index === focusedIndex ? 'bg-accent' : 'hover:bg-accent'
              }`}
              onClick={() => onToggle(tag.id)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              <Checkbox
                id={`tag-${tag.id}`}
                checked={selectedTags.includes(tag.id)}
                className="pointer-events-none"
              />
              <label
                htmlFor={`tag-${tag.id}`}
                className="text-sm font-medium flex-1 pointer-events-none"
              >
                {tag.label}
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

