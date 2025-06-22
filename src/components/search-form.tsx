'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition, useEffect } from 'react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  CirclePlus,
  X,
  CalendarIcon,
} from 'lucide-react';
import { type SearchFormValues } from '@/lib/search-params-schema';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface SearchFormProps {
  domains: string[];
  tags: { id: string; label: string }[];
  users: { id: string; name: string; hatenaId: string }[];
  initialValues: SearchFormValues;
}

export function SearchForm({
  domains,
  tags,
  users,
  initialValues,
}: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const form = useForm<SearchFormValues>({
    defaultValues: initialValues,
  });

  const { register, watch, setValue, reset } = form;
  const formValues = watch();
  
  // Sync form with URL params when they change
  useEffect(() => {
    const domainsParam = searchParams.get('domains');
    const tagsParam = searchParams.get('tags');
    const usersParam = searchParams.get('users');
    const qParam = searchParams.get('q');
    
    if (domainsParam !== null) {
      const domainValues = domainsParam ? domainsParam.split(',').filter(Boolean) : [];
      setValue('domains', domainValues);
    }
    if (tagsParam !== null) {
      const tagValues = tagsParam ? tagsParam.split(',').filter(Boolean) : [];
      setValue('tags', tagValues);
    }
    if (usersParam !== null) {
      const userValues = usersParam ? usersParam.split(',').filter(Boolean) : [];
      setValue('users', userValues);
    }
    if (qParam !== null) {
      setValue('q', qParam || '');
    }
  }, [searchParams, setValue]);

  // Update URL when form changes
  const updateURL = useCallback(() => {
    const values = form.getValues();
    const params = new URLSearchParams();
    
    if (values.q) params.set('q', values.q);
    if (values.domains.length > 0) params.set('domains', values.domains.join(','));
    if (values.tags.length > 0) params.set('tags', values.tags.join(','));
    if (values.users.length > 0) params.set('users', values.users.join(','));
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

  const handleUserToggle = useCallback((userId: string) => {
    const current = form.getValues('users');
    if (current.includes(userId)) {
      setValue('users', current.filter(u => u !== userId));
    } else {
      setValue('users', [...current, userId]);
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
      users: [],
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
        <PopoverContent className="w-[250px] p-0" align="start">
          <div className="p-3">
            <Input
              placeholder="Search domains..."
              className="h-8 mb-2"
            />
            <div className="max-h-[200px] overflow-y-auto">
              {domains.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm"
                >
                  <Checkbox
                    id={domain}
                    checked={formValues.domains.includes(domain)}
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
            </div>
          </div>
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
          <div className="p-3">
            <Input
              placeholder="Search tags..."
              className="h-8 mb-2"
            />
            <div className="max-h-[200px] overflow-y-auto">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm"
                >
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={formValues.tags.includes(tag.id)}
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
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Users Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-8 border-dashed gap-1.5">
            <CirclePlus className="h-4 w-4" />
            Users
            <Separator orientation="vertical" className="mx-2 h-4" />
            {formValues.users.length > 0 && (
              <>
                <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                  {formValues.users.length}
                </Badge>
                <div className="hidden gap-1 lg:flex">
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {formValues.users.length} selected
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
              className="h-8 mb-2"
            />
            <div className="max-h-[200px] overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm"
                >
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={formValues.users.includes(user.id)}
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
            </div>
          </div>
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
        formValues.users.length > 0 ||
        dateRange) && (
        <Button variant="ghost" onClick={resetFilters} className="h-8 px-2 lg:px-3">
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}