'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BookmarkSummaryProps {
  summary?: string | null;
  comment?: string | null;
}

export function BookmarkSummary({ summary, comment }: BookmarkSummaryProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      {summary && (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-sm text-muted-foreground break-words whitespace-normal cursor-help">
              {summary}
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-[600px]">
            <p className="text-sm whitespace-pre-wrap">{summary}</p>
          </TooltipContent>
        </Tooltip>
      )}
      {comment && (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-sm italic text-muted-foreground break-words whitespace-normal cursor-help">
              &quot;{comment}&quot;
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-[400px]">
            <p className="text-sm whitespace-pre-wrap">{comment}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}