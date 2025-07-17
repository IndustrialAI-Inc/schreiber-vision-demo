'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { useTheme } from 'next-themes';
import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, LoaderIcon } from './icons';
import { SearchIcon } from './icons-search';
import { Input } from './ui/input';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import { useUserMode } from './mode-toggle';

interface SearchHeaderProps {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  isSearchMode?: boolean;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  handleSearch?: (e: React.FormEvent) => void;
  isSearching?: boolean;
  stopSearch?: () => void;
}

function PureSearchHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  isSearchMode = false,
  searchQuery = '',
  setSearchQuery = () => {},
  handleSearch = () => {},
  isSearching = false,
  stopSearch = () => {},
}: SearchHeaderProps) {
  const router = useRouter();
  const { open } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { mode, setMode } = useUserMode();
  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-none py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {/* Search mode header */}
      {isSearchMode ? (
        <div className="flex items-center flex-grow gap-2">
          <form onSubmit={handleSearch} className="flex flex-grow gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PDFs in your repository..."
              className="flex-grow"
              disabled={isSearching}
            />
            <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? <LoaderIcon size={16} /> : <SearchIcon />}
            </Button>
            {isSearching && (
              <Button variant="outline" onClick={stopSearch}>
                Stop
              </Button>
            )}
          </form>
        </div>
      ) : (
        <>
          <ModelSelector
            selectedModelId={selectedModelId}
            className="order-2 md:order-1"
          />
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="order-1 md:order-4 ml-auto px-2 md:px-2 md:h-fit"
                onClick={() => {
                  router.push('/');
                  router.refresh();
                }}
              >
                <PlusIcon size={16} />
                <span className="md:sr-only">New</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        </>
      )}
    </header>
  );
}

export const SearchHeader = memo(PureSearchHeader, (prevProps, nextProps) => {
  // Compare all relevant props for memoization
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.isSearchMode === nextProps.isSearchMode &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.isSearching === nextProps.isSearching
  );
});
