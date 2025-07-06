import { Suspense } from 'react';
import { BookmarkDetailPageContent } from './bookmark-detail-page-content';

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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <BookmarkDetailPageContent params={params} />
    </Suspense>
  );
}