import { NextResponse } from 'next/server';
import { getDocumentsById } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const kind = searchParams.get('kind');
    
    // Basic validation
    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId parameter' }, { status: 400 });
    }
    
    // Validate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get documents by ID (which can be a chat ID in our case)
    const documents = await getDocumentsById({ id: chatId });
    
    // Filter by kind if provided
    let filteredDocuments = documents;
    if (kind) {
      filteredDocuments = documents.filter(doc => doc.kind === kind);
    }
    
    // Return in descending order of creation (newest first)
    return NextResponse.json(
      filteredDocuments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artifacts' },
      { status: 500 }
    );
  }
} 