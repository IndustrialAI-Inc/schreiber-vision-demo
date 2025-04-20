'use client';

import { useState, useRef, useEffect } from 'react';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoaderIcon } from '@/components/icons';
import { SearchIcon } from '@/components/icons-search';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  query: string;
  setQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  isSearching: boolean;
  stopSearch: () => void;
}

export function SearchInput({
  query,
  setQuery,
  handleSearch,
  isSearching,
  stopSearch,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the search input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <header className="flex sticky top-0 z-10 bg-background border-b border-border py-1.5 items-center px-4 h-10 shadow-sm">
      <SidebarToggle className="mr-2" />
      
      <div className="flex-grow">
        <form onSubmit={handleSearch} className="flex w-full gap-2">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search PDFs in your repository..."
              className="flex-grow pl-8"
              disabled={isSearching}
            />
          </div>
          <Button 
            type="submit" 
            size="sm"
            variant="default"
            disabled={isSearching || !query.trim()}
            className="px-3 h-8"
          >
            {isSearching ? 
              <LoaderIcon className="h-3.5 w-3.5 animate-spin" /> : 
              <span className="text-xs">Search</span>
            }
          </Button>
          {isSearching && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={stopSearch}
              className="px-3 h-8"
            >
              <span className="text-xs">Stop</span>
            </Button>
          )}
        </form>
      </div>
    </header>
  );
}