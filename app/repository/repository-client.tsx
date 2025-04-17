'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserFile } from '@/lib/db/schema';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  else return (bytes / 1048576).toFixed(2) + ' MB';
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function RepositoryClient({ files }: { files: UserFile[] }) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your Files Repository</h1>
      
      {files.length === 0 && (
        <p className="text-muted-foreground">You haven&apos;t uploaded any files yet.</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.map((file) => (
          <Card key={file.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="truncate text-lg">{file.fileName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDate(new Date(file.createdAt))}
              </p>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-md overflow-hidden flex items-center justify-center mb-4">
                {file.fileType.includes('image') ? (
                  <img 
                    src={file.fileUrl} 
                    alt={file.fileName}
                    className="w-full h-full object-contain"
                  />
                ) : file.fileType === 'application/pdf' ? (
                  <iframe 
                    src={file.fileUrl} 
                    className="w-full h-full"
                    title={file.fileName}
                  />
                ) : (
                  <div className="bg-muted flex items-center justify-center h-full w-full">
                    <p className="text-muted-foreground">{file.fileType}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{file.fileType.split('/')[1]?.toUpperCase()}</span>
                <span>{formatFileSize(Number(file.fileSize))}</span>
              </div>
              <div className="mt-4">
                <a 
                  href={file.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  View File
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 