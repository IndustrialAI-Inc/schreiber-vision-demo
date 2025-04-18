'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { FolderIcon, PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { ModeToggle } from './mode-toggle';
import { useUserMode } from './mode-toggle';
import { Separator } from './ui/separator';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { mode } = useUserMode();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                {mode === 'supplier' ? 'Supplier Portal' : 'Chatbot'}
              </span>
            </Link>
            <Link
              href="/repository"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-2 items-center ml-2"
            >
              <FolderIcon className="h-4 w-4" />
              <span className="text-sm font-medium hover:bg-muted rounded-md cursor-pointer px-1">
                Repository
              </span>
            </Link>
            {mode === 'schreiber' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="p-2 h-fit"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push('/');
                      router.refresh();
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">New Chat</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="px-2 py-2">
            <ModeToggle />
          </div>
          <Separator className="my-1" />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
