import React from 'react';
import { auth } from '@/app/(auth)/auth';
import { getUserFilesByUserId } from '@/lib/db/queries';

export default async function RepositoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const files = session?.user?.id 
    ? await getUserFilesByUserId({ userId: session.user.id }) 
    : [];

  // Pass files as a prop to the page component through SearchParams
  const childrenWithProps = React.Children.map(children, (child) => {
    return child;
  });

  return (
    <main className="flex min-h-screen flex-col">
      {/* We'll fetch server data directly in the page */}
      {children}
    </main>
  );
}