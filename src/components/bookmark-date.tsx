'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface BookmarkDateProps {
  date: Date;
  displayDate: string;
}

export function BookmarkDate({ date, displayDate }: BookmarkDateProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">
          {displayDate}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">
          {format(date, 'yyyy/MM/dd HH:mm:ss')}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}