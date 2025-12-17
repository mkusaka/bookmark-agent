'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/ai/ask', label: 'Ask' },
  { href: '/ai/deep-research', label: 'Deep Research' },
] as const;

export function AiTabNav() {
  const pathname = usePathname();

  return (
    <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-fit">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            pathname === tab.href
              ? 'bg-background text-foreground shadow'
              : 'hover:bg-background/50'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
