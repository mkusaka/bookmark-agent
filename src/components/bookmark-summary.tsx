'use client';

interface BookmarkSummaryProps {
  summary?: string | null;
  comment?: string | null;
}

export function BookmarkSummary({ summary, comment }: BookmarkSummaryProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      {summary && (
        <p className="text-sm text-muted-foreground break-words whitespace-normal">
          {summary}
        </p>
      )}
      {comment && (
        <p className="text-sm italic text-muted-foreground break-words whitespace-normal">
          &quot;{comment}&quot;
        </p>
      )}
    </div>
  );
}