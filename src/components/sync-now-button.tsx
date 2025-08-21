'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { syncLatestBookmarks } from '@/app/actions/sync-actions';

export function SyncNowButton() {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    setPending(true);
    try {
      const res = await syncLatestBookmarks();
      if (res.success) {
        const totalImported = res.results
          .filter((r) => typeof r.imported === 'number')
          .reduce((sum, r) => sum + (r.imported as number), 0);
        toast.success(`Sync completed: ${totalImported} new bookmarks imported`);
        router.refresh();
      } else {
        toast.error('Sync failed');
      }
    } catch {
      toast.error('Sync failed');
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={pending}
      title="Sync bookmarks now"
    >
      <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} />
      <span className="ml-2 hidden sm:inline">
        {pending ? 'Syncing...' : 'Sync Now'}
      </span>
    </Button>
  );
}
