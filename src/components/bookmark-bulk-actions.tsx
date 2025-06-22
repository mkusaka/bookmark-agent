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
    
    // Open all URLs
    selectedUrls.forEach(url => {
      window.open(url, '_blank');
    });
    
    toast.success(`Opened ${selectedUrls.length} bookmark${selectedUrls.length > 1 ? 's' : ''}`);
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