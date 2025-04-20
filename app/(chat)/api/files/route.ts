import { auth } from '@/app/(auth)/auth';
import { getUserFilesByUserId } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get('type');
    
    // Get all files for the user
    const files = await getUserFilesByUserId({ userId: session.user.id });
    
    // Filter by file type if specified
    const filteredFiles = fileType 
      ? files.filter(file => file.fileType === fileType)
      : files;
    
    console.log(`Found ${filteredFiles.length} files for user:`, 
      filteredFiles.map(f => ({
        name: f.fileName,
        url: f.fileUrl,
        type: f.fileType
      }))
    );
    
    return NextResponse.json(filteredFiles);
  } catch (error) {
    console.error("Error retrieving files:", error);
    return new Response('Error retrieving files', { status: 500 });
  }
}