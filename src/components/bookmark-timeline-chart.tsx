'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface BookmarkTimelineChartProps {
  data: Array<{
    month: string;
    count: number;
  }>;
}

export function BookmarkTimelineChart({ data }: BookmarkTimelineChartProps) {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
      <LineChart 
        data={data} 
        margin={{ 
          top: 5, 
          right: isMobile ? 5 : 30, 
          left: isMobile ? 0 : 20, 
          bottom: 60 
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis 
          dataKey="month" 
          stroke={axisColor}
          fontSize={isMobile ? 10 : 11}
          angle={-45}
          textAnchor="end"
          height={80}
          tickFormatter={formatXAxisTick}
          interval="preserveStartEnd"
        />
        <YAxis 
          stroke={axisColor}
          fontSize={isMobile ? 10 : 12}
          width={isMobile ? 35 : undefined}
          tickFormatter={(value: number) => value.toLocaleString()}
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
          formatter={(value) => {
            const normalizedValue = typeof value === 'number' ? value : Number.parseFloat(String(value ?? 0));
            const safeValue = Number.isFinite(normalizedValue) ? normalizedValue : 0;
            return [`${safeValue.toLocaleString()} bookmarks`, 'Count'];
          }}
          labelFormatter={(label) => {
            if (typeof label !== 'string') {
              return label;
            }

            const [year, month] = label.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = Number.parseInt(month, 10) - 1;

            if (!year || monthIndex < 0 || monthIndex >= monthNames.length) {
              return label;
            }

            return `${monthNames[monthIndex]} ${year}`;
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
