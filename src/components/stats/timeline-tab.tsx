'use client';

import { useState } from 'react';
import { BookmarkTimelineChart } from '@/components/bookmark-timeline-chart';
import { Button } from '@/components/ui/button';

interface TimelineTabProps {
  initialData: Array<{ month: Date; count: number }>;
}

export function TimelineTab({ initialData }: TimelineTabProps) {
  const [timeRange, setTimeRange] = useState<{ start?: Date; end?: Date }>({});
  const [selectedPreset, setSelectedPreset] = useState<string>('all');
  
  const applyPresetFilter = (months: number | null) => {
    if (months === null) {
      setTimeRange({});
      setSelectedPreset('all');
    } else {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - months);
      setTimeRange({ start, end });
      setSelectedPreset(`${months}m`);
    }
  };
  
  const handleManualDateChange = () => {
    setSelectedPreset('custom');
  };
  
  const filteredData = initialData.filter(item => {
    if (!timeRange.start && !timeRange.end) return true;
    const itemDate = new Date(item.month);
    if (timeRange.start && itemDate < timeRange.start) return false;
    if (timeRange.end && itemDate > timeRange.end) return false;
    return true;
  }).map(item => ({
    month: new Date(item.month).toISOString().slice(0, 7),
    count: item.count
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={selectedPreset === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyPresetFilter(null)}
        >
          全期間
        </Button>
        <Button
          variant={selectedPreset === '6m' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyPresetFilter(6)}
        >
          6ヶ月
        </Button>
        <Button
          variant={selectedPreset === '12m' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyPresetFilter(12)}
        >
          12ヶ月
        </Button>
        <Button
          variant={selectedPreset === '24m' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyPresetFilter(24)}
        >
          24ヶ月
        </Button>
        <Button
          variant={selectedPreset === '36m' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyPresetFilter(36)}
        >
          36ヶ月
        </Button>
        <Button
          variant={selectedPreset === '48m' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyPresetFilter(48)}
        >
          48ヶ月
        </Button>
      </div>
      
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="start-date" className="text-sm font-medium">From:</label>
          <input
            id="start-date"
            type="month"
            value={timeRange.start ? timeRange.start.toISOString().slice(0, 7) : ''}
            onChange={(e) => {
              setTimeRange(prev => ({
                ...prev,
                start: e.target.value ? new Date(e.target.value) : undefined
              }));
              handleManualDateChange();
            }}
            className="px-3 py-1 border rounded-md"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="end-date" className="text-sm font-medium">To:</label>
          <input
            id="end-date"
            type="month"
            value={timeRange.end ? timeRange.end.toISOString().slice(0, 7) : ''}
            onChange={(e) => {
              setTimeRange(prev => ({
                ...prev,
                end: e.target.value ? new Date(e.target.value) : undefined
              }));
              handleManualDateChange();
            }}
            className="px-3 py-1 border rounded-md"
          />
        </div>
        
        {(timeRange.start || timeRange.end) && (
          <button
            onClick={() => {
              setTimeRange({});
              setSelectedPreset('all');
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>
      
      <BookmarkTimelineChart data={filteredData} />
    </div>
  );
}