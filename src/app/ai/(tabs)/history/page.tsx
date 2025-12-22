import { getAiSessions } from '@/app/actions/ai-session-actions';
import { AiSessionList } from '@/components/ai-session-list';
import type { AiSessionType } from '@/types/ai-session';

export const dynamic = 'force-dynamic';

async function loadMoreSessions(cursor: string) {
  'use server';
  const result = await getAiSessions({}, { field: 'createdAt', order: 'desc' }, 25, cursor);
  return {
    sessions: result.sessions,
    pagination: result.pagination,
  };
}

async function filterSessions(filters: { type?: AiSessionType; searchQuery?: string }) {
  'use server';
  const result = await getAiSessions(
    {
      type: filters.type,
      searchQuery: filters.searchQuery,
    },
    { field: 'createdAt', order: 'desc' },
    25
  );
  return {
    sessions: result.sessions,
    pagination: result.pagination,
    total: result.total,
  };
}

export default async function HistoryPage() {
  const { sessions, pagination, total } = await getAiSessions(
    {},
    { field: 'createdAt', order: 'desc' },
    25
  );

  return (
    <AiSessionList
      initialSessions={sessions}
      initialPagination={pagination}
      initialTotal={total}
      onLoadMore={loadMoreSessions}
      onFilter={filterSessions}
    />
  );
}
