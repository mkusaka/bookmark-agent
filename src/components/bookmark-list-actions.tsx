'use client';

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
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useSelection } from './search-page-client';

export function BookmarkCheckbox({ bookmarkId }: { bookmarkId: string }) {
  const { selectedBookmarks, toggleBookmark } = useSelection();
  
  return (
    <Checkbox
      checked={selectedBookmarks.has(bookmarkId)}
      onCheckedChange={() => toggleBookmark(bookmarkId)}
      aria-label="Select row"
      className="translate-y-[2px]"
    />
  );
}

export function SelectAllCheckbox({ bookmarkIds }: { bookmarkIds: string[]; bookmarkCount: number }) {
  const { selectedBookmarks, toggleAll } = useSelection();
  const allSelected = bookmarkIds.length > 0 && bookmarkIds.every(id => selectedBookmarks.has(id));
  
  return (
    <Checkbox
      checked={allSelected}
      onCheckedChange={() => toggleAll(bookmarkIds)}
      aria-label="Select all"
      className="translate-y-[2px]"
    />
  );
}

export function BookmarkActions({ url, bookmarkId }: { url: string; bookmarkId: string }) {
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/bookmarks/${bookmarkId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bookmark',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard');
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    }
  };

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
        <DropdownMenuItem onClick={() => {
          navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard');
        }}>
          <Copy className="mr-2 h-4 w-4" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DomainBadgeClickable({ 
  domain, 
  href 
}: { 
  domain: string;
  isSelected: boolean;
  href: string;
}) {
  return (
    <Link 
      href={href}
      className="cursor-pointer"
    >
      {domain}
    </Link>
  );
}

export function TagBadgeClickable({ 
  tag, 
  href 
}: { 
  tag: { id: string; label: string };
  isSelected: boolean;
  href: string;
}) {
  return (
    <Link 
      href={href}
      className="cursor-pointer"
    >
      {tag.label}
    </Link>
  );
}