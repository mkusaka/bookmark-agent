import { getBookmarks, getDomains, getTags } from '../actions/bookmark-actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { TimelineTabContent } from '@/components/timeline-tab-content';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StatsPage() {
  // Fetch all data in parallel
  const [bookmarksData, domains, tags] = await Promise.all([
    getBookmarks(
      { 
        searchQuery: '', 
        selectedDomains: [], 
        selectedTags: [], 
        selectedUsers: [] 
      }, 
      { field: 'bookmarkedAt', order: 'desc' }, 
      10000 // Increased to get more historical data
    ),
    getDomains(),
    getTags(),
  ]);

  // Calculate stats
  const totalBookmarks = bookmarksData.total;
  const totalDomains = domains.length;
  const totalTags = tags.length;
  
  // Get top domains by bookmark count
  const domainCounts = bookmarksData.bookmarks.reduce((acc, bookmark) => {
    const domain = bookmark.entry.normalizedDomain;
    if (domain) {
      acc[domain] = (acc[domain] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const allDomains = Object.entries(domainCounts)
    .sort(([, a], [, b]) => b - a);
  
  // Get top tags by usage
  const tagCounts = bookmarksData.bookmarks.reduce((acc, bookmark) => {
    bookmark.tags.forEach(tag => {
      acc[tag.label] = (acc[tag.label] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const allTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a);
  
  // Get bookmarks by month
  const bookmarksByMonth = bookmarksData.bookmarks.reduce((acc, bookmark) => {
    const date = new Date(bookmark.bookmarkedAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sortedMonths = Object.entries(bookmarksByMonth)
    .sort(([a], [b]) => a.localeCompare(b));
  

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            <Link href="/stats" className="hover:underline">
              Bookmark Statistics
            </Link>
          </h2>
          <p className="text-muted-foreground">
            Overview of your bookmark collection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/search">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookmarks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDomains.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTags.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="domains">All Domains</TabsTrigger>
          <TabsTrigger value="tags">All Tags</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="space-y-4">
          <TimelineTabContent sortedMonths={sortedMonths} />
        </TabsContent>
        
        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Domains</CardTitle>
              <CardDescription>
                All bookmarked domains sorted by frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allDomains.map(([domain, count], index) => (
                  <div key={domain} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {index + 1}.
                      </span>
                      <Link 
                        href={`/search?domains=${encodeURIComponent(domain)}`}
                        className="text-sm hover:underline"
                      >
                        {domain}
                      </Link>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Tags</CardTitle>
              <CardDescription>
                All tags sorted by usage frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allTags.map(([tag, count], index) => (
                  <div key={tag} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {index + 1}.
                      </span>
                      <Link 
                        href={`/search?tags=${encodeURIComponent(tag)}`}
                        className="text-sm hover:underline"
                      >
                        {tag}
                      </Link>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}