'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigationPending } from '@/contexts/navigation-context';

interface BookmarkSortLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  sortState?: 'asc' | 'desc' | null;
}

export function BookmarkSortLink({ href, children, className, sortState = null }: BookmarkSortLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { setIsPending } = useNavigationPending();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(href);
    });
  };

  // Update global pending state
  useEffect(() => {
    setIsPending(isPending);
  }, [isPending, setIsPending]);

  const SortIcon = sortState === 'asc' ? ChevronUp : sortState === 'desc' ? ChevronDown : ChevronsUpDown;

  return (
    <Button 
      variant="ghost" 
      className={className || "-ml-3 h-8 data-[state=open]:bg-accent"}
      onClick={handleClick}
    >
      {children}
      <SortIcon className="ml-2 h-4 w-4" />
    </Button>
  );
}