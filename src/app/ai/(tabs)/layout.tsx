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
          <PageActionLink href="/ai/store" label="Store" icon={Database} />
          <PageActionLink href="/search" label="Search" icon={Search} />
          <PageActionLink href="/stats" label="Stats" icon={BarChart3} />
        </>
      }
    >
      <AiTabNav />
      {children}
    </PageLayout>
  );
}
