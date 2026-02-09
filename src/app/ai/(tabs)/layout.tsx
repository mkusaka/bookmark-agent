import { PageLayout } from '@/components/page-layout';
import { PageActionLink } from '@/components/page-action-link';
import { Search, BarChart3, Database } from 'lucide-react';
import { AiTabNav } from '@/components/ai-tab-nav';

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout
      title="AI Bookmark Search"
      description="Gemini File Searchでブックマーク全文から関連情報を探して回答します"
      actions={
        <>
          <PageActionLink href="/ai/store">
            <Database className="h-4 w-4" />
            Store
          </PageActionLink>
          <PageActionLink href="/search">
            <Search className="h-4 w-4" />
            Search
          </PageActionLink>
          <PageActionLink href="/stats">
            <BarChart3 className="h-4 w-4" />
            Stats
          </PageActionLink>
        </>
      }
    >
      <AiTabNav />
      {children}
    </PageLayout>
  );
}
