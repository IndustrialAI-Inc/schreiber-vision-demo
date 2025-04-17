import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { deleteUserFile, getUserFileById } from '@/lib/db/queries';
import { del } from '@vercel/blob';

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Get file to check ownership and get URL
    const file = await getUserFileById({ id: fileId });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Ensure user owns the file
    if (file.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
      // Delete from Blob storage if URL exists
      if (file.fileUrl) {
        await del(file.fileUrl);
      }
      
      // Delete from database
      await deleteUserFile({ id: fileId });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in delete file API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 