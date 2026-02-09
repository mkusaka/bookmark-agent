import Link from 'next/link';
import { Suspense } from 'react';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { PageActionLink } from '@/components/page-action-link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { listGeminiStoreDocuments } from '@/app/actions/gemini-store-actions';
import { GeminiStoreDocumentList } from '@/components/gemini-store-document-list';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  pageToken?: string | string[];
  prevPageToken?: string | string[];
}>;

function toSingleValue(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildNextPageUrl(
  nextPageToken: string,
  currentPageToken?: string
): string {
  const params = new URLSearchParams();
  params.set('pageToken', nextPageToken);
  if (currentPageToken) {
    params.set('prevPageToken', currentPageToken);
  }
  return `/ai/store?${params.toString()}`;
}

function buildPrevPageUrl(prevPageToken?: string): string {
  if (!prevPageToken) {
    return '/ai/store';
  }
  const params = new URLSearchParams();
  params.set('pageToken', prevPageToken);
  return `/ai/store?${params.toString()}`;
}

function StoreDocumentsFallback() {
  return (
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
  );
}

async function StoreDocumentsSection({
  pageToken,
  prevPageToken,
}: {
  pageToken?: string;
  prevPageToken?: string;
}) {
  const result = await listGeminiStoreDocuments(pageToken);

  const hasPrevPage = !!prevPageToken || !!pageToken;

  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        {result.documents.length} documents in {result.storeName}
      </div>
      <GeminiStoreDocumentList documents={result.documents} />

      <div className="flex items-center justify-between">
        <div>
          {hasPrevPage && (
            <Link href={buildPrevPageUrl(prevPageToken)}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            </Link>
          )}
        </div>
        <div />
        <div>
          {result.nextPageToken && (
            <Link href={buildNextPageUrl(result.nextPageToken, pageToken)}>
              <Button variant="outline" size="sm">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function GeminiStorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const pageToken = toSingleValue(params.pageToken);
  const prevPageToken = toSingleValue(params.prevPageToken);

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
      <Suspense fallback={<StoreDocumentsFallback />}>
        <StoreDocumentsSection
          pageToken={pageToken}
          prevPageToken={prevPageToken}
        />
      </Suspense>
    </PageLayout>
  );
}
