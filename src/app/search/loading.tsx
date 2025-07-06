import { PageLayout } from '@/components/page-layout';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export default function SearchLoading() {
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
      <div className="space-y-4">
        {/* Search form skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-2 flex-wrap">
            <Skeleton className="h-8 w-[150px] lg:w-[250px]" />
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-8 w-[100px]" />
          </div>
        </div>
        
        {/* Bulk actions skeleton */}
        <div className="h-8" />
        
        {/* Bookmark list skeleton */}
        <div className="rounded-md border">
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-1" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-5 w-[80%]" />
                    <Skeleton className="h-4 w-[60%]" />
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Pagination skeleton */}
        <div className="flex items-center justify-between px-2 py-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}