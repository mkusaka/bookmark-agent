import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBookmarkStats, getContributionData } from '@/app/actions/stats-actions';
import { ContributionGraph } from '@/components/stats/contribution-graph';

export async function OverviewTab() {
  const [stats, contributionData] = await Promise.all([
    getBookmarkStats(),
    getContributionData(),
  ]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookmarks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <ContributionGraph data={contributionData} />
    </div>
  );
}