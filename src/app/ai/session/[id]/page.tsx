import { notFound } from 'next/navigation';
import { getAiSessionById } from '@/app/actions/ai-session-actions';
import { AiSessionDetail } from '@/components/ai-session-detail';
import { PageLayout } from '@/components/page-layout';
import { PageActionLink } from '@/components/page-action-link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getAiSessionById(id);

  if (!session) {
    notFound();
  }

  return (
    <PageLayout
      title="Session Detail"
      description={`${session.type === 'ask' ? 'Ask' : 'Deep Research'} session`}
      actions={
        <PageActionLink href="/ai/history">
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </PageActionLink>
      }
    >
      <AiSessionDetail session={session} />
    </PageLayout>
  );
}
