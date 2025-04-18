import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  getTimelineByChatId, 
  getVisibleTimelines, 
  createOrUpdateTimeline 
} from '@/lib/db/queries';

// Get a specific timeline or all visible timelines
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');
  
  console.log(`Timeline GET request: chatId=${chatId || 'none'}`);
  
  try {
    if (chatId) {
      // Get timeline for a specific chat
      const timelineData = await getTimelineByChatId({ chatId });
      
      console.log(`Timeline for chatId=${chatId}:`, timelineData ? 'found' : 'not found');
      
      if (!timelineData) {
        return NextResponse.json(null);
      }
      
      return NextResponse.json(timelineData);
    } else {
      // Get all visible timelines
      const timelines = await getVisibleTimelines();
      console.log(`GET visible timelines: found ${timelines.length} timeline(s)`);
      return NextResponse.json(timelines.length > 0 ? timelines[0] : null);
    }
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return new Response('Error fetching timeline', { status: 500 });
  }
}

// Create or update a timeline
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const json = await request.json();
    const { chatId, isVisible, steps } = json;
    
    console.log('POST timeline request:', {
      chatId,
      isVisible,
      stepsLength: steps?.length
    });
    
    if (!chatId) {
      return new Response('Missing chatId', { status: 400 });
    }
    
    if (!steps || !Array.isArray(steps)) {
      return new Response('Invalid steps format', { status: 400 });
    }
    
    // Create/update the timeline
    const updatedTimeline = await createOrUpdateTimeline({
      chatId,
      isVisible,
      steps
    });
    
    console.log('Timeline updated:', {
      chatId: updatedTimeline.chatId,
      isVisible: updatedTimeline.isVisible
    });
    
    return NextResponse.json(updatedTimeline);
  } catch (error) {
    console.error('Error updating timeline:', error);
    return new Response('Error updating timeline', { status: 500 });
  }
} 