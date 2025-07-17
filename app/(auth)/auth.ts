// Disabled auth for spec-centric system
import NextAuth from 'next-auth';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [],
  callbacks: {
    authorized: async () => true, // Always allow access
  },
});
