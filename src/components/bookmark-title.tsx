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
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium truncate text-primary hover:underline block"
        >
          {displayText}
        </a>
      </TooltipTrigger>
      <TooltipContent className="max-w-[600px]">
        <p className="text-sm whitespace-pre-wrap break-words">{displayText}</p>
      </TooltipContent>
    </Tooltip>
  );
}