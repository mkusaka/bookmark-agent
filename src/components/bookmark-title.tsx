'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BookmarkTitleProps {
  title?: string;
  url: string;
}

export function BookmarkTitle({ title, url }: BookmarkTitleProps) {
  const displayText = title || url;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="font-medium truncate">
          {displayText}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-[600px]">
        <p className="text-sm whitespace-pre-wrap break-words">{displayText}</p>
      </TooltipContent>
    </Tooltip>
  );
}