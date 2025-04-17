import { auth } from '@/app/(auth)/auth';
import { getUserFilesByUserId } from '@/lib/db/queries';
import RepositoryClient from './repository-client';

export default async function RepositoryPage() {
  const session = await auth();
  const files = session?.user?.id 
    ? await getUserFilesByUserId({ userId: session.user.id }) 
    : [];

  return <RepositoryClient files={files} />;
}