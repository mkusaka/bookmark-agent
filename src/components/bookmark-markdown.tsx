import { fetchMarkdownContent } from '@/app/actions/markdown-actions';
import { MarkdownRenderer } from './markdown-renderer';

interface BookmarkMarkdownProps {
  url: string;
}

export async function BookmarkMarkdown({ url }: BookmarkMarkdownProps) {
  const markdown = await fetchMarkdownContent(url);

  if (!markdown) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
        <p className="text-yellow-800 dark:text-yellow-200">
          Unable to fetch content from this URL.
        </p>
      </div>
    );
  }

  return <MarkdownRenderer content={markdown} />;
}