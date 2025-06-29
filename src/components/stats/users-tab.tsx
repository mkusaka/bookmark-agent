import Link from 'next/link';
import { getUserStats } from '@/app/actions/stats-actions';

export async function UsersTab() {
  const userStats = await getUserStats();

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Total users: {userStats.length.toLocaleString()}
      </div>
      
      <div className="grid gap-2 max-h-[600px] overflow-y-auto">
        {userStats.map((user, index) => (
          <div key={user.id} className="flex items-center justify-between py-2 px-4 hover:bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-8">#{index + 1}</span>
              <Link
                href={`/?user=${encodeURIComponent(user.hatenaId)}`}
                className="font-medium hover:underline"
              >
                {user.hatenaId}
              </Link>
            </div>
            <span className="text-sm text-muted-foreground">
              {user.count.toLocaleString()} bookmarks
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}