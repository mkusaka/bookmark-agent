import { getOrFetchMarkdownContent } from '@/app/actions/markdown-actions';
import { BookmarkMarkdownClient } from './bookmark-markdown-client';

interface BookmarkMarkdownProps {
  bookmarkId: string;
  url: string;
}

export async function BookmarkMarkdown({ bookmarkId, url }: BookmarkMarkdownProps) {
  const markdown = await getOrFetchMarkdownContent(bookmarkId, url);
  
  return <BookmarkMarkdownClient content={markdown} />;
}