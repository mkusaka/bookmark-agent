import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getBookmarkById } from '@/app/actions/bookmark-actions';
import { BookmarkDetail } from '@/components/bookmark-detail';
import { BookmarkMarkdown } from '@/components/bookmark-markdown';
import { MarkdownSkeleton } from '@/components/markdown-skeleton';

export default async function BookmarkDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const bookmark = await getBookmarkById(params.id);

  if (!bookmark) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <BookmarkDetail bookmark={bookmark} />
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Content</h2>
        <Suspense fallback={<MarkdownSkeleton />}>
          <BookmarkMarkdown url={bookmark.url} />
        </Suspense>
      </div>
    </div>
  );
}