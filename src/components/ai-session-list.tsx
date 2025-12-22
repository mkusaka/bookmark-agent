'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiSessionCard } from '@/components/ai-session-card';
import { Loader2, Search } from 'lucide-react';
import type { AiSessionWithBookmarks, AiSessionPaginationInfo, AiSessionType } from '@/types/ai-session';

interface AiSessionListProps {
  initialSessions: AiSessionWithBookmarks[];
  initialPagination: AiSessionPaginationInfo;
  initialTotal: number;
  onLoadMore: (cursor: string) => Promise<{
    sessions: AiSessionWithBookmarks[];
    pagination: AiSessionPaginationInfo;
  }>;
  onFilter: (filters: { type?: AiSessionType; searchQuery?: string }) => Promise<{
    sessions: AiSessionWithBookmarks[];
    pagination: AiSessionPaginationInfo;
    total: number;
  }>;
}

export function AiSessionList({
  initialSessions,
  initialPagination,
  initialTotal,
  onLoadMore,
  onFilter,
}: AiSessionListProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [pagination, setPagination] = useState(initialPagination);
  const [total, setTotal] = useState(initialTotal);
  const [typeFilter, setTypeFilter] = useState<AiSessionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = () => {
    if (!pagination.nextCursor) return;
    startTransition(async () => {
      const result = await onLoadMore(pagination.nextCursor!);
      setSessions((prev) => [...prev, ...result.sessions]);
      setPagination(result.pagination);
    });
  };

  const handleFilter = () => {
    startTransition(async () => {
      const result = await onFilter({
        type: typeFilter === 'all' ? undefined : typeFilter,
        searchQuery: searchQuery || undefined,
      });
      setSessions(result.sessions);
      setPagination(result.pagination);
      setTotal(result.total);
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTypeFilter(value as AiSessionType | 'all');
    startTransition(async () => {
      const result = await onFilter({
        type: value === 'all' ? undefined : (value as AiSessionType),
        searchQuery: searchQuery || undefined,
      });
      setSessions(result.sessions);
      setPagination(result.pagination);
      setTotal(result.total);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={handleTypeChange}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">All</option>
          <option value="ask">Ask</option>
          <option value="deep-research">Deep Research</option>
        </select>
        <Button onClick={handleFilter} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {total} sessions
      </p>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No sessions found
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <AiSessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      {pagination.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
