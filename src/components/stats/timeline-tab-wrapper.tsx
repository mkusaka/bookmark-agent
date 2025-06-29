import { getTimelineStats } from '@/app/actions/stats-actions';
import { TimelineTab } from './timeline-tab';

export async function TimelineTabWrapper() {
  const timelineData = await getTimelineStats();
  return <TimelineTab initialData={timelineData} />;
}