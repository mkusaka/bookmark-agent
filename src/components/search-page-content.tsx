import { getDomains, getTags } from '@/app/actions/bookmark-actions';
import { parseSearchParams, buildFiltersFromParams, buildSortFromParams } from '@/lib/search-params-schema';
import { SearchForm } from '@/components/search-form';
import { BookmarkListSection } from '@/components/bookmark-list-section';

interface SearchPageContentProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function SearchPageContent({ searchParams }: SearchPageContentProps) {
  // Parse search params
  const params = parseSearchParams(searchParams);
  
  // Build filters and sort from parsed params
  const filters = buildFiltersFromParams(params);
  const sort = buildSortFromParams(params);
  
  // Fetch domains and tags
  const [domains, tags] = await Promise.all([
    getDomains(),
    getTags(),
  ]);
  
  // Convert params to form values
  const formValues = {
    q: params.q || '',
    domains: params.domains,
    tags: params.tags,
    users: params.users,
    from: params.from,
    to: params.to,
    sortBy: params.sortBy,
    order: params.order,
    cursor: params.cursor,
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <SearchForm
          domains={domains}
          tags={tags}
          initialValues={formValues}
        />
      </div>

      <BookmarkListSection
        filters={filters}
        sort={sort}
        cursor={params.cursor}
        currentParams={searchParams}
      />
    </>
  );
}