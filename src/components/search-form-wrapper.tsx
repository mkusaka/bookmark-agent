import { getDomains, getTags } from '@/app/actions/bookmark-actions';
import { SearchForm } from '@/components/search-form';
import type { SearchFormValues } from '@/lib/search-params-schema';

interface SearchFormWrapperProps {
  initialValues: SearchFormValues;
}

export async function SearchFormWrapper({ 
  initialValues
}: SearchFormWrapperProps) {
  const [domains, tags] = await Promise.all([
    getDomains(),
    getTags(),
  ]);

  return (
    <SearchForm
      domains={domains}
      tags={tags}
      initialValues={initialValues}
    />
  );
}