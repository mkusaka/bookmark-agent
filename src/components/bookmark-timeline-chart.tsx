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
  
  // Format month labels for better display
  const formatXAxisTick = (value: string) => {
    const [year, month] = value.split('-');
    // Show year only for January or first/last data point
    if (month === '01' || value === data[0]?.month || value === data[data.length - 1]?.month) {
      return `${month}/${year.slice(2)}`;
    }
    return month;
  };
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis 
          dataKey="month" 
          stroke={axisColor}
          fontSize={11}
          angle={-45}
          textAnchor="end"
          height={80}
          tickFormatter={formatXAxisTick}
          interval="preserveStartEnd"
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
          formatter={(value: number) => [`${value} bookmarks`, 'Count']}
          labelFormatter={(label: string) => {
            const [year, month] = label.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
          }}
        />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke={lineColor}
          strokeWidth={2}
          dot={{ fill: lineColor, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}