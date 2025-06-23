'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useNavigationPending } from '@/contexts/navigation-context';

interface FilterLinkProps {
  type: 'domains' | 'tags';
  value: string;
  label: string;
  isSelected: boolean;
  currentParams: { [key: string]: string | string[] | undefined };
}

export function FilterLink({ type, value, label, isSelected, currentParams }: FilterLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { setIsPending } = useNavigationPending();
  
  useEffect(() => {
    setIsPending(isPending);
  }, [isPending, setIsPending]);
  
  // Build URL with proper param handling
  const buildUrl = () => {
    const params = new URLSearchParams();
    
    // Copy all existing params
    Object.entries(currentParams).forEach(([key, val]) => {
      if (val && key !== 'cursor') { // Reset cursor on filter change
        if (Array.isArray(val)) {
          params.set(key, val.join(','));
        } else {
          params.set(key, val);
        }
      }
    });
    
    // Handle the filter toggle
    const currentValues = currentParams[type];
    const valueArray = typeof currentValues === 'string' 
      ? currentValues.split(',').filter(Boolean)
      : Array.isArray(currentValues) 
      ? currentValues 
      : [];
    
    if (isSelected) {
      // Remove the value
      const newValues = valueArray.filter(v => v !== value);
      if (newValues.length > 0) {
        params.set(type, newValues.join(','));
      } else {
        params.delete(type);
      }
    } else {
      // Add the value
      const newValues = [...valueArray, value];
      params.set(type, newValues.join(','));
    }
    
    return `?${params.toString()}`;
  };
  
  const handleClick = () => {
    startTransition(() => {
      router.push(buildUrl());
    });
  };
  
  const variant = type === 'domains' 
    ? (isSelected ? "default" : "outline")
    : (isSelected ? "default" : "secondary");
    
  const className = type === 'domains'
    ? "font-mono text-xs w-fit whitespace-nowrap shrink-0"
    : "text-xs w-fit whitespace-nowrap shrink-0";
  
  return (
    <Badge 
      variant={variant} 
      className={`${className} cursor-pointer`}
      onClick={handleClick}
    >
      {label}
    </Badge>
  );
}