'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';

interface BookmarkTimelineChartProps {
  data: Array<{
    month: string;
    count: number;
  }>;
}

export function BookmarkTimelineChart({ data }: BookmarkTimelineChartProps) {
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#666' : '#888';
  const gridColor = isDark ? '#333' : '#e0e0e0';
  const lineColor = isDark ? '#818cf8' : '#6366f1';
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis 
          dataKey="month" 
          stroke={axisColor}
          fontSize={12}
        />
        <YAxis 
          stroke={axisColor}
          fontSize={12}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '6px',
          }}
          labelStyle={{
            color: isDark ? '#e5e7eb' : '#111827',
          }}
        />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke={lineColor}
          strokeWidth={2}
          dot={{ fill: lineColor, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}