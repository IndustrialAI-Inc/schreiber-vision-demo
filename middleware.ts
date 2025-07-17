// Disabled middleware for spec-centric system
export { auth as middleware } from '@/app/(auth)/auth';

// Allow all routes
export const config = {
  matcher: [],
};
