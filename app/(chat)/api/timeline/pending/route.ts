import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getVisibleTimelines } from '@/lib/db/queries';

// Get timelines that need supplier review
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    // Get all visible timelines
    const timelines = await getVisibleTimelines();
    
    // Filter for timelines that are in the 'send' or 'feedback' stage
    const pendingTimelines = timelines.filter(timeline => {
      // Check if any step with id 'send' or 'feedback' has status 'in-progress'
      return timeline.steps.some(step => 
        (step.id === 'send' && step.status === 'in-progress') || 
        (step.id === 'feedback' && step.status === 'in-progress')
      );
    });
    
    console.log(`GET pending timelines: found ${pendingTimelines.length} timeline(s) needing review`);
    
    return NextResponse.json(pendingTimelines);
  } catch (error) {
    console.error('Error fetching pending timelines:', error);
    return new Response('Error fetching pending timelines', { status: 500 });
  }
} 