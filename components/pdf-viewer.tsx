import React, { useState, useEffect, useRef } from 'react';
import cn from 'classnames';
import { ZoomInIcon, ZoomOutIcon, ArrowLeftIcon, ArrowRightIcon, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface PDFViewerProps {
  title: string;
  content: string; // URL or base64
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: string;
  isInline: boolean;
}

export function PDFViewer({ title, content, status, isInline }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 20, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 20, 40));
  };

  const handlePageChange = (increment: number) => {
    setCurrentPage(prev => {
      const newPage = prev + increment;
      return Math.max(1, Math.min(newPage, totalPages));
    });
  };

  const handleReload = () => {
    setLoading(true);
    setError(null);
    if (iframeRef.current) {
      // Force a reload by adding a timestamp to the URL if needed
      const timestamp = new Date().getTime();
      const url = content.includes('?') ? 
        `${content}&_t=${timestamp}` : 
        `${content}?_t=${timestamp}`;
      iframeRef.current.src = url;
    }
  };

  useEffect(() => {
    if (content) {
      setLoading(true);
      setError(null);
    }
  }, [content]);

  useEffect(() => {
    if (iframeRef.current && content && !status.includes('streaming')) {
      const iframe = iframeRef.current;
      iframe.onload = () => {
        setLoading(false);
        setTimeout(() => {
          setTotalPages(1); // Not accurate, but avoids UI bugs
        }, 1000);
      };
      iframe.onerror = () => {
        setError('Failed to load PDF. Check if the URL is accessible.');
        setLoading(false);
      };
    }
  }, [content, status]);

  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => setLoading(false), 2000); // 2 seconds is usually enough
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const openExternalLink = () => {
    if (content) {
      window.open(content, '_blank');
    }
  };

  return (
    <div className="flex flex-col w-full">
      {status === 'streaming' ? (
        <div className="flex flex-row gap-4 items-center justify-center h-[calc(100dvh-60px)]">
          <div>Processing PDF...</div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center bg-muted p-2 rounded-t-md">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(-1)}
                disabled={currentPage <= 1}
              >
                <ArrowLeftIcon size={16} />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages || '?'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(1)}
                disabled={currentPage >= totalPages && totalPages !== 0}
              >
                <ArrowRightIcon size={16} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomOut}
                disabled={zoom <= 40}
              >
                <ZoomOutIcon size={16} />
              </Button>
              <span className="text-sm">{zoom}%</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomInIcon size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReload}
                title="Reload PDF"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
          <div 
            className={cn('overflow-auto border border-t-0 rounded-b-md relative', {
              'h-[calc(100dvh-110px)]': !isInline,
              'h-[200px]': isInline,
            })}
          >
            {error ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
                <p className="text-red-500">{error}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReload}>
                    <RefreshCw size={16} className="mr-2" /> Try Again
                  </Button>
                  <Button variant="outline" size="sm" onClick={openExternalLink}>
                    Open in New Tab
                  </Button>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                className={cn('w-full h-full', {
                  'transform-origin': 'top left',
                })}
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  width: `${100 / (zoom / 100)}%`,
                  height: `${100 / (zoom / 100)}%`,
                }}
                src={content}
                title={title}
                allow="autoplay; encrypted-media"
              />
            )}
          </div>
          {content && (
            <div className="mt-2 text-center">
              <Button variant="link" onClick={openExternalLink} className="text-xs">
                Open PDF in new tab
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 