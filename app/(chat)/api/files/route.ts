import { getUserFilesByUserId } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('[FILES] Getting files (auth disabled for testing)');

  // Use test user ID for demo/testing purposes
  const testUserId = 'b4278fb7-8292-43df-b00e-af7c1ecfc808';

  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get('type');

    // Get all files for the test user
    const files = await getUserFilesByUserId({ userId: testUserId });

    // Filter by file type if specified
    const filteredFiles = fileType
      ? files.filter((file) => file.fileType === fileType)
      : files;

    console.log(
      `Found ${filteredFiles.length} files for user:`,
      filteredFiles.map((f) => ({
        name: f.fileName,
        url: f.fileUrl,
        type: f.fileType,
      })),
    );

    return NextResponse.json(filteredFiles);
  } catch (error) {
    console.error('Error retrieving files:', error);
    return new Response('Error retrieving files', { status: 500 });
  }
}
