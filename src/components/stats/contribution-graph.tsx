'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContributionGraphProps {
  data: Array<{ date: string; count: number }>;
}

function getContributionLevel(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function getLevelColor(level: number): string {
  switch (level) {
    case 0:
      return 'bg-muted';
    case 1:
      return 'bg-green-200 dark:bg-green-900';
    case 2:
      return 'bg-green-400 dark:bg-green-700';
    case 3:
      return 'bg-green-500 dark:bg-green-500';
    case 4:
      return 'bg-green-600 dark:bg-green-400';
    default:
      return 'bg-muted';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ContributionGraph({ data }: ContributionGraphProps) {
  const { weeks, maxCount, monthLabels, totalCount } = useMemo(() => {
    // Build a map of date -> count
    const countMap = new Map<string, number>();
    let total = 0;
    data.forEach(d => {
      countMap.set(d.date, d.count);
      total += d.count;
    });

    // Calculate max count for color scaling
    const max = Math.max(...data.map(d => d.count), 1);

    // Generate 52 weeks of data ending today
    const today = new Date();
    const weeks: Array<Array<{ date: string; count: number; level: number }>> = [];
    const labels: Array<{ month: string; weekIndex: number }> = [];

    // Start from 52 weeks ago, aligned to Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364 - startDate.getDay());

    let currentMonth = -1;
    let currentWeek: Array<{ date: string; count: number; level: number }> = [];

    for (let i = 0; i <= 371; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      if (date > today) break;

      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      const count = countMap.get(dateStr) || 0;
      const level = getContributionLevel(count, max);
      currentWeek.push({ date: dateStr, count, level });

      // Track month labels
      const month = date.getMonth();
      if (month !== currentMonth && dayOfWeek === 0) {
        currentMonth = month;
        labels.push({ month: MONTHS[month], weekIndex: weeks.length });
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, maxCount: max, monthLabels: labels, totalCount: total };
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Bookmark Activity</CardTitle>
        <span className="text-sm text-muted-foreground">
          {totalCount.toLocaleString()} bookmarks in the last year
        </span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-1 min-w-max">
            {/* Month labels */}
            <div className="flex text-xs text-muted-foreground mb-1">
              <div className="w-8" /> {/* Spacer for day labels */}
              <div className="flex">
                {monthLabels.map((label, i) => (
                  <div
                    key={i}
                    className="text-xs"
                    style={{ marginLeft: i === 0 ? 0 : `${(label.weekIndex - (monthLabels[i - 1]?.weekIndex || 0)) * 12 - 24}px` }}
                  >
                    {label.month}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] text-xs text-muted-foreground pr-1">
                {DAYS.map((day, i) => (
                  <div key={day} className="h-[10px] leading-[10px]" style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <TooltipProvider delayDuration={100}>
                <div className="flex gap-[3px]">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[3px]">
                      {week.map((day, dayIndex) => (
                        <Tooltip key={day.date}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-[10px] h-[10px] rounded-sm ${getLevelColor(day.level)} cursor-pointer hover:ring-1 hover:ring-foreground/50`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">
                              {day.count} bookmark{day.count !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(day.date)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-[3px]">
                {[0, 1, 2, 3, 4].map(level => (
                  <div
                    key={level}
                    className={`w-[10px] h-[10px] rounded-sm ${getLevelColor(level)}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
