'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { SearchIcon } from './icons-search';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

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
      "flex items-center gap-2 overflow-x-auto py-2 px-4 justify-center",
      className
    )}>
      {/* <SearchIcon size={16} className="text-amber-700 dark:text-amber-400 shrink-0" /> */}
      {/* <Search className='size-4 text-bright' /> */}
      
      <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-hide justify-center">
        {quickSearches.map((query, index) => (
          <Button
            key={`search-pill-${index}`}
            variant="outline"
            size="sm"
            onClick={() => onPillClick(query)}
            disabled={disabled}
            className="rounded-full bg-bright hover:bg-amber-100 dark:bg-fulldark50 dark:hover:bg-zinc-700 border-amber-200 dark:border-zinc-700 px-3 py-1 h-7 text-xs whitespace-nowrap text-bright dark:text-bright shadow-sm"
          >
            {query}
          </Button>
        ))}
      </div>
    </div>
  );
}