import { getUserFilesByUserId } from '@/lib/db/queries';
import RepositoryClient from './repository-client';

export default async function RepositoryPage() {
  // Use test user ID for demo/testing purposes
  const testUserId = 'b4278fb7-8292-43df-b00e-af7c1ecfc808';
  const files = await getUserFilesByUserId({ userId: testUserId });

  return <RepositoryClient files={files} />;
}
