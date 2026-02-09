import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageActionLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  hideLabelOnMobile?: boolean;
  className?: string;
}

export function PageActionLink({
  href,
  label,
  icon: Icon,
  hideLabelOnMobile = false,
  className,
}: PageActionLinkProps) {
  return (
    <Link href={href}>
      <Button variant="outline" size="sm" className={cn('gap-2', className)}>
        <Icon className="h-4 w-4" />
        <span className={cn(hideLabelOnMobile && 'hidden sm:inline')}>{label}</span>
      </Button>
    </Link>
  );
}
