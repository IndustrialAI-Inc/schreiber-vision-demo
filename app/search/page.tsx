import type { Metadata } from 'next';
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { SearchChat } from '@/components/search-chat';
import { generateUUID } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Semantic Search - Schreiber Endeavor AI',
  description:
    'Search through your supplier specifications using advanced AI semantic search',
};

export default async function SearchPage() {
  // TEMPORARY: Bypass auth for testing - REMOVE IN PRODUCTION
  // const session = await auth();

  // if (!session) {
  //   redirect('/login');
  // }

  // Generate a unique search session ID
  const searchId = generateUUID();

  return (
    <SearchChat
      id={searchId}
      initialMessages={[]}
      selectedChatModel="deepseek-r1-distill-llama-70b"
      selectedVisibilityType="private"
      isReadonly={false}
    />
  );
}
