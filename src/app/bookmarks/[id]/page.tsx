import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getBookmarkById } from '@/app/actions/bookmark-actions';
import { BookmarkDetail } from '@/components/bookmark-detail';
import { BookmarkMarkdown } from '@/components/bookmark-markdown';
import { MarkdownSkeleton } from '@/components/markdown-skeleton';

export default async function BookmarkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookmark = await getBookmarkById(id);

  if (!bookmark) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Suspense fallback={<div>Loading...</div>}>
        <BookmarkDetail bookmark={bookmark} />
      </Suspense>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Markdown Content
        </h2>
        <Suspense fallback={<MarkdownSkeleton />}>
          <BookmarkMarkdown bookmarkId={bookmark.id} url={bookmark.url} />
        </Suspense>
      </div>
    </div>
  );
}