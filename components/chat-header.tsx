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

function PureChatHeader({
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
}: {
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
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { mode, setMode } = useUserMode();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {/* Different header for search mode */}
      {isSearchMode ? (
        <>
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
                {isSearching ? <LoaderIcon className="animate-spin" /> : <SearchIcon />}
              </Button>
              {isSearching && (
                <Button variant="outline" onClick={stopSearch}>
                  Stop
                </Button>
              )}
            </form>
          </div>
        </>
      ) : (
        <>
          {(!open || windowWidth < 768) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
                  onClick={() => {
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                  <span className="md:sr-only">New Chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
          )}

          {!isReadonly && (
            <ModelSelector
              selectedModelId={selectedModelId}
              className="order-1 md:order-2"
            />
          )}

          {!isReadonly && (
            <VisibilitySelector
              chatId={chatId}
              selectedVisibilityType={selectedVisibilityType}
              className="order-1 md:order-3"
            />
          )}

          <Button
            className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 hidden md:flex py-1.5 px-2 h-fit md:h-[34px] order-4 md:ml-auto"
            onClick={() => {
              const newMode = mode === 'schreiber' ? 'supplier' : 'schreiber';
              setMode(newMode);
              setTheme(newMode === 'supplier' ? 'light' : 'dark');
              router.refresh();
            }}
          >
            {mode === 'supplier' ? 'Schreiber Mode' : 'Supplier Mode'}
          </Button>
        </>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  // Only re-render when model changes or search mode/query changes
  return (
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.isSearchMode === nextProps.isSearchMode &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.isSearching === nextProps.isSearching
  );
});
