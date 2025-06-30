import Link from 'next/link';
import { getTagStats } from '@/app/actions/stats-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export async function TagsTab() {
  const { totalTags, tags } = await getTagStats();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTags.toLocaleString()}</div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">All Tags</h3>
        <div className="grid gap-2 max-h-[600px] overflow-y-auto">
          {tags.map((tag, index) => (
            <div key={tag.id} className="flex items-center justify-between py-2 px-4 hover:bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-8">#{index + 1}</span>
                <Link
                  href={`/search?tags=${encodeURIComponent(tag.label)}`}
                  className="font-medium hover:underline"
                >
                  {tag.label}
                </Link>
              </div>
              <span className="text-sm text-muted-foreground">
                {tag.count.toLocaleString()} bookmarks
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}