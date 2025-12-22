import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAiSessionById } from '@/app/actions/ai-session-actions';
import { AiSessionDetail } from '@/components/ai-session-detail';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
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
        <Link href="/ai/history">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
        </Link>
      }
    >
      <AiSessionDetail session={session} />
    </PageLayout>
  );
}
