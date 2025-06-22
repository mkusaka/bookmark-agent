'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ExternalLink,
  MoreHorizontal,
  Copy,
} from 'lucide-react';

export function BookmarkCheckbox({ }: { bookmarkId: string }) {
  const [checked, setChecked] = useState(false);
  
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={setChecked}
      aria-label="Select row"
      className="translate-y-[2px]"
    />
  );
}

export function SelectAllCheckbox({ }: { bookmarkCount: number }) {
  const [checked, setChecked] = useState(false);
  
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={setChecked}
      aria-label="Select all"
      className="translate-y-[2px]"
    />
  );
}

export function BookmarkActions({ url }: { url: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => window.open(url, '_blank')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in new tab
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(url)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DomainBadgeClickable({ 
  domain, 
  isSelected,
  href 
}: { 
  domain: string;
  isSelected: boolean;
  href: string;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = href;
  };

  return (
    <span 
      onClick={handleClick}
      className="cursor-pointer"
    >
      {domain}
    </span>
  );
}

export function TagBadgeClickable({ 
  tag, 
  isSelected,
  href 
}: { 
  tag: { id: string; label: string };
  isSelected: boolean;
  href: string;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = href;
  };

  return (
    <span 
      onClick={handleClick}
      className="cursor-pointer"
    >
      {tag.label}
    </span>
  );
}