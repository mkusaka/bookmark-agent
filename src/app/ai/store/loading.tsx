import { ArrowLeft } from 'lucide-react';
import { PageActionLink } from '@/components/page-action-link';
import { PageLayout } from '@/components/page-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <PageLayout
      title="Gemini File Store"
      description="Browse documents indexed in Gemini File Store"
      actions={
        <PageActionLink href="/ai/ask">
          <ArrowLeft className="h-4 w-4" />
          Back to AI
        </PageActionLink>
      }
    >
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-64" />
        <div className="grid gap-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </PageLayout>
  );
}
