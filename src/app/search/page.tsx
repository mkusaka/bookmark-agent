import { PageLayout } from '@/components/page-layout';
import { SearchPageClient } from '@/components/search-page-client';
import { SearchPageContent } from '@/components/search-page-content';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const rawParams = await searchParams;

  return (
    <PageLayout
      title={
        <Link href="/search" className="hover:underline">
          Bookmark Search
        </Link>
      }
      description="Search and manage bookmarks with advanced filtering"
      actions={
        <Link href="/stats">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Stats
          </Button>
        </Link>
      }
    >
      <SearchPageClient>
        <SearchPageContent searchParams={rawParams} />
      </SearchPageClient>
    </PageLayout>
  );
}
