
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { auth } from '@/app/(auth)/auth';

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
      <SidebarProvider>
        <main className="flex flex-grow h-svh">
          <SidebarInset className="flex flex-col flex-grow">
            {children}
          </SidebarInset>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}