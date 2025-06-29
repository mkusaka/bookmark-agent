import { getDomainStats } from '@/app/actions/stats-actions';
import { DomainsTabClient } from './domains-tab-client';

export async function DomainsTab() {
  const domainStats = await getDomainStats();
  const totalDomains = domainStats.length;

  return <DomainsTabClient domainStats={domainStats} totalDomains={totalDomains} />;
}