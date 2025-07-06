import { notFound } from 'next/navigation';
import { getBookmarkById } from '@/app/actions/bookmark-actions';
import { BookmarkDetail } from '@/components/bookmark-detail';

interface BookmarkDetailPageContentProps {
  params: Promise<{ id: string }>;
}

export async function BookmarkDetailPageContent({ params }: BookmarkDetailPageContentProps) {
  const { id } = await params;
  
  // Validate that id is a numeric string
  const bookmarkId = parseInt(id, 10);
  if (isNaN(bookmarkId)) {
    notFound();
  }

  const bookmark = await getBookmarkById(id);
  if (!bookmark) {
    notFound();
  }

  return <BookmarkDetail bookmark={bookmark} />;
}