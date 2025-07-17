'use client';

import { useRouter } from 'next/navigation';
import { Upload, Database, FileSearch2, Home, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Separator } from './ui/separator';

export function AppSidebar() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const navigationItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/upload', icon: Upload, label: 'Upload Specs' },
    { href: '/specs', icon: Database, label: 'Spec Dashboard' },
    { href: '/search', icon: FileSearch2, label: 'Search Specs' },
  ];

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-row items-center gap-2 p-2">
              <div className="text-xl font-bold text-blue-600">📋</div>
              <span className="text-lg font-semibold">Spec Intelligence</span>
            </div>
          </SidebarMenuItem>
          <Separator className="my-2" />
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild>
                <Link
                  href={item.href}
                  onClick={() => setOpenMobile(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Supplier Specification Intelligence Platform
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
