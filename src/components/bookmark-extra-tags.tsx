'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterLink } from '@/components/bookmark-filter-link';

interface BookmarkExtraTagsProps {
  extraCount: number;
  extraTags: Array<{ id: string; label: string }>;
  selectedTags: string[];
  currentParams: { [key: string]: string | string[] | undefined };
}

export function BookmarkExtraTags({ 
  extraCount, 
  extraTags, 
  selectedTags, 
  currentParams 
}: BookmarkExtraTagsProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="text-xs cursor-help">
          +{extraCount}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-wrap gap-1 max-w-[300px]">
          {extraTags.map((tag) => (
            <FilterLink
              key={tag.id}
              type="tags"
              value={tag.id}
              label={tag.label}
              isSelected={selectedTags.includes(tag.id)}
              currentParams={currentParams}
            />
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}