import { redirect } from 'next/navigation';
import { generateUUID } from '@/lib/utils';
import { auth } from '@/app/(auth)/auth';

export default async function SearchRedirectPage() {
  // Generate a new search ID
  const id = generateUUID();
  
  // Ensure user is authenticated
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  
  // Redirect to search/[id]
  redirect(`/search/${id}`);
}