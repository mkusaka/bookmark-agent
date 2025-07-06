'use client';

import Link from 'next/link';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface DomainStat {
  domain: string;
  count: number;
}

interface DomainsTabClientProps {
  domainStats: DomainStat[];
  totalDomains: number;
}

export function DomainsTabClient({ domainStats, totalDomains }: DomainsTabClientProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: domainStats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Total domains: {totalDomains.toLocaleString()}
      </div>
      
      <div
        ref={parentRef}
        className="max-h-[600px] overflow-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const stat = domainStats[virtualItem.index];
            
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="flex items-center justify-between py-2 px-4 hover:bg-muted/50 rounded-lg h-full">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-12">#{(virtualItem.index + 1).toLocaleString()}</span>
                    <Link
                      href={`/search?domains=${encodeURIComponent(stat.domain)}`}
                      className="font-medium hover:underline"
                    >
                      {stat.domain}
                    </Link>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {stat.count.toLocaleString()} bookmarks
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}