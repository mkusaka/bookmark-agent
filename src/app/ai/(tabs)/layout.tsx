import Link from 'next/link';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Search, BarChart3, Database } from 'lucide-react';
import { AiTabNav } from '@/components/ai-tab-nav';

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout
      title="AI Bookmark Search"
      description="Gemini File Searchでブックマーク全文から関連情報を探して回答します"
      actions={
        <>
          <Link href="/ai/store">
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Store
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </Link>
          <Link href="/stats">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>
          </Link>
        </>
      }
    >
      <AiTabNav />
      {children}
    </PageLayout>
  );
}
