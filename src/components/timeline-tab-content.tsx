'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookmarkTimelineChart } from '@/components/bookmark-timeline-chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimelineTabContentProps {
  sortedMonths: [string, number][];
}

export function TimelineTabContent({ sortedMonths }: TimelineTabContentProps) {
  const [range, setRange] = useState<string>('all');

  // Filter months based on selected range
  const getFilteredMonths = () => {
    if (range === 'all') return sortedMonths;
    
    const months = parseInt(range);
    return sortedMonths.slice(-months);
  };

  const filteredMonths = getFilteredMonths();
  const chartData = filteredMonths.map(([month, count]) => ({
    month,
    count,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bookmarks Timeline</CardTitle>
            <CardDescription>
              Bookmarks added per month
            </CardDescription>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
              <SelectItem value="36">Last 36 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <BookmarkTimelineChart data={chartData} />
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium mb-2">
            Monthly Details ({range === 'all' ? 'All time' : `Last ${range} months`})
          </h4>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {filteredMonths.slice().reverse().map(([month, count]) => (
              <div key={month} className="flex items-center justify-between py-1">
                <span className="text-sm">{month}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}