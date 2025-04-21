'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { SearchIcon } from './icons-search';
import { cn } from '@/lib/utils';

interface SearchPillsProps {
  onPillClick: (query: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SearchPills({ 
  onPillClick, 
  className, 
  disabled = false 
}: SearchPillsProps) {
  // Sample quick search queries based on common food ingredient searches
  const quickSearches = [
    'Country of origin',
    'Allergen status',
    'Kosher certification',
    'Gluten free',
    'Nutritional info',
    'Sources used'
  ];

  return (
    <div className={cn(
      "flex items-center gap-2 overflow-x-auto py-2 px-4",
      className
    )}>
      <SearchIcon size={16} className="text-amber-700 dark:text-amber-400 shrink-0" />
      
      <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-hide">
        {quickSearches.map((query, index) => (
          <Button
            key={`search-pill-${index}`}
            variant="outline"
            size="sm"
            onClick={() => onPillClick(query)}
            disabled={disabled}
            className="rounded-full bg-white/20 hover:bg-white/30 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-white/30 dark:border-zinc-700 px-3 py-1 h-7 text-xs whitespace-nowrap text-white shadow-sm"
          >
            {query}
          </Button>
        ))}
      </div>
    </div>
  );
}