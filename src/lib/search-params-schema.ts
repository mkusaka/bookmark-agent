import { z } from 'zod';

// Schema for search parameters from URL
export const searchParamsSchema = z.object({
  q: z.string().optional(),
  domains: z.string().optional().transform((val) => 
    val ? val.split(',').filter(Boolean) : []
  ),
  tags: z.string().optional().transform((val) => 
    val ? val.split(',').filter(Boolean) : []
  ),
  users: z.string().optional().transform((val) => 
    val ? val.split(',').filter(Boolean) : []
  ),
  from: z.string().optional().transform((val) => 
    val ? new Date(val) : undefined
  ),
  to: z.string().optional().transform((val) => 
    val ? new Date(val) : undefined
  ),
  sortBy: z.enum(['bookmarkedAt', 'title', 'user']).optional().default('bookmarkedAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  cursor: z.string().optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

// Schema for form values (internal state)
export const searchFormSchema = z.object({
  q: z.string().default(''),
  domains: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  users: z.array(z.string()).default([]),
  from: z.date().optional(),
  to: z.date().optional(),
  sortBy: z.enum(['bookmarkedAt', 'title', 'user']).default('bookmarkedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  cursor: z.string().optional(),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;

// Helper function to parse search params from URLSearchParams or Next.js searchParams
export function parseSearchParams(params: Record<string, string | string[] | undefined>): SearchParams {
  // Convert array values to first value for simplicity
  const normalizedParams = Object.entries(params).reduce((acc, [key, value]) => {
    acc[key] = Array.isArray(value) ? value[0] : value;
    return acc;
  }, {} as Record<string, string | undefined>);

  // Use safeParse to handle errors gracefully
  const result = searchParamsSchema.safeParse(normalizedParams);
  
  if (result.success) {
    return result.data;
  }
  
  // Return default values on parse error
  console.warn('Invalid search params:', result.error);
  return {
    q: undefined,
    domains: [],
    tags: [],
    users: [],
    from: undefined,
    to: undefined,
    sortBy: 'bookmarkedAt',
    order: 'desc',
    cursor: undefined,
  };
}

// Helper to build BookmarkFilters from parsed params
export function buildFiltersFromParams(params: SearchParams) {
  return {
    searchQuery: params.q || '',
    selectedDomains: params.domains,
    selectedTags: params.tags,
    selectedUsers: params.users,
    dateRange: params.from || params.to ? {
      from: params.from,
      to: params.to,
    } : undefined,
  };
}

// Helper to build BookmarkSort from parsed params
export function buildSortFromParams(params: SearchParams) {
  return {
    field: params.sortBy,
    order: params.order,
  };
}