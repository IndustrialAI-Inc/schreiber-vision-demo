import type { Metadata } from 'next';
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { SearchChat } from '@/components/search-chat';
import { generateUUID } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'PDF Search',
  description: 'Search through your repository PDFs using AI',
};

export default async function SearchPage() {
  // Generate a new search ID
  const id = generateUUID();

  // Handle authentication
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  
  // Use DeepSeek model to enable visible reasoning process
  const selectedChatModel = "deepseek-r1-distill-llama-70b";
  
  // Render search interface directly
  return (
    <div className="w-full min-h-screen bg-background dark:bg-zinc-900" style={{ minHeight: '100vh' }}>
      <SearchChat
        id={id}
        initialMessages={[]}
        selectedChatModel={selectedChatModel}
        selectedVisibilityType="private"
        isReadonly={false}
      />
    </div>
  );
}