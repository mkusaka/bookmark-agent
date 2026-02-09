import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageActionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function PageActionLink({
  href,
  children,
  className,
}: PageActionLinkProps) {
  return (
    <Link href={href}>
      <Button variant="outline" size="sm" className={cn('gap-2', className)}>
        {children}
      </Button>
    </Link>
  );
}
