import Link from 'next/link';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { listGeminiStoreDocuments } from '@/app/actions/gemini-store-actions';
import { GeminiStoreDocumentList } from '@/components/gemini-store-document-list';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ pageToken?: string; history?: string }>;

function buildNextPageUrl(
  nextPageToken: string,
  currentHistory: string[],
  currentPageToken?: string
): string {
  // Add current page token to history (for going back)
  const newHistory = currentPageToken
    ? [...currentHistory, currentPageToken]
    : currentHistory;

  const params = new URLSearchParams();
  params.set('pageToken', nextPageToken);
  if (newHistory.length > 0) {
    params.set('history', newHistory.join(','));
  }
  return `/ai/store?${params.toString()}`;
}

function buildPrevPageUrl(tokenHistory: string[]): string {
  if (tokenHistory.length === 0) {
    return '/ai/store';
  }

  const newHistory = tokenHistory.slice(0, -1);
  const prevPageToken = tokenHistory[tokenHistory.length - 1];

  if (newHistory.length === 0 && !prevPageToken) {
    return '/ai/store';
  }

  const params = new URLSearchParams();
  if (prevPageToken) {
    params.set('pageToken', prevPageToken);
  }
  if (newHistory.length > 0) {
    params.set('history', newHistory.join(','));
  }

  const queryString = params.toString();
  return queryString ? `/ai/store?${queryString}` : '/ai/store';
}

export default async function GeminiStorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { pageToken, history } = await searchParams;
  const result = await listGeminiStoreDocuments(pageToken);

  // Parse history: comma-separated list of previous page tokens
  const tokenHistory = history ? history.split(',').filter(Boolean) : [];
  const currentPageIndex = tokenHistory.length;

  return (
    <PageLayout
      title="Gemini File Store"
      description={
        result.success
          ? `${result.documents.length} documents in ${result.storeName}`
          : 'File Storeの内容を確認'
      }
      actions={
        <Link href="/ai">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AI
          </Button>
        </Link>
      }
    >
      {result.success ? (
        <div className="flex flex-col gap-4">
          <GeminiStoreDocumentList documents={result.documents} />

          <div className="flex items-center justify-between">
            <div>
              {currentPageIndex > 0 && (
                <Link href={buildPrevPageUrl(tokenHistory)}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                </Link>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Page {currentPageIndex + 1}
            </div>
            <div>
              {result.nextPageToken && (
                <Link href={buildNextPageUrl(result.nextPageToken, tokenHistory, pageToken)}>
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
