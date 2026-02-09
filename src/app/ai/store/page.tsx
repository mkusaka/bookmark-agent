import Link from 'next/link';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { PageActionLink } from '@/components/page-action-link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { listGeminiStoreDocuments } from '@/app/actions/gemini-store-actions';
import { GeminiStoreDocumentList } from '@/components/gemini-store-document-list';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ pageToken?: string; prevPageToken?: string }>;

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

export default async function GeminiStorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { pageToken, prevPageToken } = await searchParams;
  const result = await listGeminiStoreDocuments(pageToken);

  const hasPrevPage = !!prevPageToken || !!pageToken;

  return (
    <PageLayout
      title="Gemini File Store"
      description={
        result.success
          ? `${result.documents.length} documents in ${result.storeName}`
          : 'File Storeの内容を確認'
      }
      actions={
        <PageActionLink href="/ai">
          <ArrowLeft className="h-4 w-4" />
          Back to AI
        </PageActionLink>
      }
    >
      {result.success ? (
        <div className="flex flex-col gap-4">
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
      ) : (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">{result.error}</p>
        </div>
      )}
    </PageLayout>
  );
}
