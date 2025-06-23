'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';
import { useNavigationPending } from '@/contexts/navigation-context';

interface BookmarkSortLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showChevron?: boolean;
}

export function BookmarkSortLink({ href, children, className, showChevron = true }: BookmarkSortLinkProps) {
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

  return (
    <Button 
      variant="ghost" 
      className={className || "-ml-3 h-8 data-[state=open]:bg-accent"}
      onClick={handleClick}
    >
      {children}
      {showChevron && <ChevronsUpDown className="ml-2 h-4 w-4" />}
    </Button>
  );
}