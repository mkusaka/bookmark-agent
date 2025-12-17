import Link from 'next/link';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Search, BarChart3, Database } from 'lucide-react';
import { AiBookmarkSearch } from '@/components/ai-bookmark-search';
import { AiDeepResearch } from '@/components/ai-deep-research';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

export default function AiPage() {
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
      <Tabs defaultValue="ask" className="w-full">
        <TabsList>
          <TabsTrigger value="ask">Ask</TabsTrigger>
          <TabsTrigger value="deep-research">Deep Research</TabsTrigger>
        </TabsList>
        <TabsContent value="ask" className="mt-4">
          <AiBookmarkSearch />
        </TabsContent>
        <TabsContent value="deep-research" className="mt-4">
          <AiDeepResearch />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
