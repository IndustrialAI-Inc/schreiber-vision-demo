
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { auth } from '@/app/(auth)/auth';
import { SearchHeader } from '@/components/search-header';

export default async function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider className="remove-sidebar-style">
        <div className="search-page bg-background dark:bg-zinc-900 min-h-screen w-full flex">
          <main className="flex flex-col flex-grow w-full">
            <SearchHeader
              chatId="search"
              selectedModelId="chat-model"
              selectedVisibilityType="public"
              isReadonly={false}
            />
            <SidebarInset className="flex flex-col flex-grow w-full bg-background dark:bg-zinc-900">
              {children}
            </SidebarInset>
          </main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}