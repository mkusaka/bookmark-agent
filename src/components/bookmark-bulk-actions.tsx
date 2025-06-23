'use client';

import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface BookmarkBulkActionsProps {
  bookmarks: Array<{ id: string; url: string }>;
  selectedBookmarks: Set<string>;
  onClearSelection: () => void;
}

export function BookmarkBulkActions({ bookmarks, selectedBookmarks, onClearSelection }: BookmarkBulkActionsProps) {
  const selectedCount = selectedBookmarks.size;
  
  const handleOpenSelected = () => {
    const selectedUrls = bookmarks
      .filter(b => selectedBookmarks.has(b.id))
      .map(b => b.url);
    
    if (selectedUrls.length === 0) return;
    
    // Warn if trying to open many bookmarks
    if (selectedUrls.length > 10) {
      const confirmed = window.confirm(
        `You are about to open ${selectedUrls.length} bookmarks. Your browser may block some popups. Continue?`
      );
      if (!confirmed) return;
    }
    
    // Try to open all URLs immediately (within the user gesture context)
    let openedCount = 0;
    const failedUrls: string[] = [];
    
    selectedUrls.forEach(url => {
      try {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (newWindow) {
          openedCount++;
        } else {
          failedUrls.push(url);
        }
      } catch (e) {
        failedUrls.push(url);
      }
    });
    
    // Provide feedback
    if (failedUrls.length > 0) {
      toast.warning(
        `Opened ${openedCount} of ${selectedUrls.length} bookmarks. ${failedUrls.length} were blocked by your browser.`,
        {
          action: failedUrls.length === 1 ? {
            label: 'Copy URL',
            onClick: () => {
              navigator.clipboard.writeText(failedUrls[0]);
              toast.success('URL copied to clipboard');
            }
          } : undefined
        }
      );
    } else {
      toast.success(`Opened ${openedCount} bookmark${openedCount > 1 ? 's' : ''}`);
    }
    
    onClearSelection();
  };
  
  if (selectedCount === 0) return null;
  
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
      <span className="text-sm text-muted-foreground">
        {selectedCount} bookmark{selectedCount > 1 ? 's' : ''} selected
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpenSelected}
        className="gap-2"
      >
        <ExternalLink className="h-4 w-4" />
        Open Selected
      </Button>
    </div>
  );
}