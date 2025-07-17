import { auth } from '@/app/(auth)/auth';
import { getChatById, getVotesByChatId, voteMessage } from '@/lib/db/queries';

// Disabled for spec-centric system
export async function GET() {
  return new Response('Voting disabled in spec-centric system', {
    status: 404,
  });
}

export async function PATCH() {
  return new Response('Voting disabled in spec-centric system', {
    status: 404,
  });
}
