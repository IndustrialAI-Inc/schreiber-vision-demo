import type { Metadata } from 'next';
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { SearchChat } from '@/components/search-chat';

export const metadata: Metadata = {
  title: 'PDF Search',
  description: 'Search through your repository PDFs using AI',
};

interface Params {
  id: string;
}

export default async function SearchPage({ params }: { params: Params }) {
  // First, await all async operations
  const paramsAsync = await Promise.resolve(params);
  const id = paramsAsync.id;

  // Handle authentication
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  
  // Use a hardcoded model - getChatModelFromCookies doesn't seem to exist
  const selectedChatModel = "deepseek-r1-distill-llama-70b";
  
  // Skip cookie saving since we're using a hardcoded model

  // Render search interface with same structure as chat
  return (
    <SearchChat
      id={id}
      initialMessages={[]}
      selectedChatModel="deepseek-r1-distill-llama-70b" // Hardcode to DeepSeek model
      selectedVisibilityType="private"
      isReadonly={false}
    />
  );
}