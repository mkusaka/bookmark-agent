import { getTimelineStats } from '@/app/actions/stats-actions';
import { TimelineTab } from './timeline-tab';

export async function TimelineTabWrapper() {
  const timelineData = await getTimelineStats();
  // Transform data to match expected format
  const transformedData = timelineData.map(item => ({
    month: new Date(item.date),
    count: item.count
  }));
  return <TimelineTab initialData={transformedData} />;
}