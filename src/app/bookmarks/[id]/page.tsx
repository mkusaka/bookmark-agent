import { Suspense } from 'react';
import { BookmarkDetailPageContent } from './bookmark-detail-page-content';
import { Skeleton } from '@/components/ui/skeleton';

// Disable static generation for dynamic routes
export async function generateStaticParams() {
  return [];
}

export default function BookmarkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    }>
      <BookmarkDetailPageContent params={params} />
    </Suspense>
  );
}