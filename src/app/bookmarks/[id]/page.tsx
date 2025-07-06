import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { getBookmarkById } from '@/app/actions/bookmark-actions';
import { BookmarkDetail } from '@/components/bookmark-detail';
import { BookmarkMarkdown } from '@/components/bookmark-markdown';
import { MarkdownSkeleton } from '@/components/markdown-skeleton';
import { MarkdownRefreshButton } from '@/components/markdown-refresh-button';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Search, BarChart3 } from 'lucide-react';

async function BookmarkDetailContent({ id }: { id: string }) {
  const bookmark = await getBookmarkById(id);

  if (!bookmark) {
    notFound();
  }

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <BookmarkDetail bookmark={bookmark} />
      </Suspense>
      
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Markdown Content
          </h2>
          <MarkdownRefreshButton bookmarkId={bookmark.id} url={bookmark.url} />
        </div>
        <Suspense fallback={<MarkdownSkeleton />}>
          <BookmarkMarkdown bookmarkId={bookmark.id} url={bookmark.url} />
        </Suspense>
      </div>
    </>
  );
}

export default async function BookmarkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageLayout
      title="Bookmark Details"
      description="Viewing bookmark details"
      actions={
        <>
          <Link href="/search">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </Link>
          <Link href="/stats">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>
          </Link>
        </>
      }
    >
      <Suspense fallback={<div>Loading bookmark...</div>}>
        <BookmarkDetailContent id={id} />
      </Suspense>
    </PageLayout>
  );
}