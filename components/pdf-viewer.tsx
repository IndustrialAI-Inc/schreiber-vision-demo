import React from 'react';
import cn from 'classnames';

interface PDFViewerProps {
  title: string;
  content: string; // URL or base64
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: string;
  isInline: boolean;
}

export function PDFViewer({ title, content, status, isInline }: PDFViewerProps) {
  return (
    <div
      className={cn('flex flex-row items-center justify-center w-full', {
        'h-[calc(100dvh-60px)]': !isInline,
        'h-[200px]': isInline,
      })}
    >
      {status === 'streaming' ? (
        <div className="flex flex-row gap-4 items-center">
          <div>Processing PDF...</div>
        </div>
      ) : (
        <iframe
          className={cn('w-full max-w-[800px] h-[80vh] border', {
            'p-0 md:p-20': !isInline,
          })}
          src={content}
          title={title}
        />
      )}
    </div>
  );
} 