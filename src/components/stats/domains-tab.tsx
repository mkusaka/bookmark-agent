import Link from 'next/link';
import { getDomainStats } from '@/app/actions/stats-actions';

export async function DomainsTab() {
  const domainStats = await getDomainStats();
  const totalDomains = domainStats.length;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Total domains: {totalDomains.toLocaleString()}
      </div>
      
      <div className="grid gap-2 max-h-[600px] overflow-y-auto">
        {domainStats.map((stat, index) => (
          <div key={stat.domain} className="flex items-center justify-between py-2 px-4 hover:bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-8">#{index + 1}</span>
              <Link
                href={`/?domain=${encodeURIComponent(stat.domain)}`}
                className="font-medium hover:underline"
              >
                {stat.domain}
              </Link>
            </div>
            <span className="text-sm text-muted-foreground">
              {stat.count.toLocaleString()} bookmarks
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}