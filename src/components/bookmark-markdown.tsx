import { fetchMarkdownContent } from '@/app/actions/markdown-actions';
import { BookmarkMarkdownClient } from './bookmark-markdown-client';

interface BookmarkMarkdownProps {
  url: string;
}

export async function BookmarkMarkdown({ url }: BookmarkMarkdownProps) {
  const markdown = await fetchMarkdownContent(url);
  
  return <BookmarkMarkdownClient content={markdown} />;
}