'use client';

import { CheckCircleFillIcon, ClockRewind } from '@/components/icons';
import { useSupplierTimeline } from '@/hooks/use-supplier-timeline';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUserMode } from './mode-toggle';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { useArtifact } from '@/hooks/use-artifact';
import { useEffect, useState } from 'react';
import { parse } from 'papaparse';

interface SupplierTimelineProps {
  chatId: string;
}

export function SupplierTimeline({ chatId }: SupplierTimelineProps) {
  // For debugging path extraction
  const pathname = usePathname();
  const { mode } = useUserMode();
  const { setArtifact, artifact } = useArtifact();
  const [sheetContent, setSheetContent] = useState<string>('');
  const [missingFields, setMissingFields] = useState<number>(0);
  
  const { timeline, isTimelineVisible, updateStepStatus } = useSupplierTimeline(chatId);

  // Fetch sheet content when needed (for supplier mode)
  useEffect(() => {
    if (mode === 'supplier' && chatId) {
      fetch(`/api/artifacts?chatId=${chatId}&kind=sheet`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const latestSheet = data[0];
            setSheetContent(latestSheet.content || '');
            
            // Count missing fields
            try {
              const result = parse<string[]>(latestSheet.content, { skipEmptyLines: true });
              let count = 0;
              
              result.data.forEach((row, index) => {
                if (index === 0) return; // Skip header
                if (row[0] && row[1] && (!row[2] || row[2].trim() === '')) {
                  count++;
                }
              });
              
              setMissingFields(count);
            } catch (error) {
              console.error('Error analyzing sheet:', error);
            }
          }
        })
        .catch(err => {
          console.error('Error fetching sheet content:', err);
        });
    }
  }, [chatId, mode]);
  
  // Only show if this chat's timeline is visible
  if (!isTimelineVisible) return null;
  
  // Check if send step is in progress (waiting for supplier feedback)
  const isSendInProgress = timeline.steps.some(
    step => step.id === 'send' && step.status === 'in-progress'
  );
  
  // Check if feedback step is in progress
  const isFeedbackInProgress = timeline.steps.some(
    step => step.id === 'feedback' && step.status === 'in-progress'
  );
  
  // Handler for "Submit for Review" button - updates timeline and opens artifact panel
  const handleProvideFeedback = async () => {
    try {
      // Mark send as completed and feedback as in-progress
      await updateStepStatus('send', 'completed');
      await updateStepStatus('feedback', 'in-progress');
      
      // Update SWR cache to refresh UI
      mutate('/api/timeline');
      mutate(`/api/timeline?chatId=${chatId}`);
      mutate('/api/timeline/pending');
      
      // Open the sheet artifact panel if it exists
      try {
        const artifactRes = await fetch(`/api/artifacts?chatId=${chatId}&kind=sheet`);
        if (artifactRes.ok) {
          const artifacts = await artifactRes.json();
          if (artifacts && artifacts.length > 0) {
            const latestSheet = artifacts[0];
            
            // Open the sheet in the artifact panel
            setArtifact({
              documentId: latestSheet.id || 'sheet-view',
              title: latestSheet.title || 'Specification Sheet',
              kind: 'sheet',
              content: latestSheet.content || '',
              isVisible: true,
              status: 'idle',
              boundingBox: {
                top: 0,
                left: 0,
                width: 0,
                height: 0
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching artifact:', error);
      }
    } catch (error) {
      console.error('Timeline update error:', error);
    }
  };
  
  // Handler for when supplier completes feedback
  const handleCompleteFeedback = async () => {
    try {
      // Mark feedback as completed
      await updateStepStatus('feedback', 'completed');
      
      // Update SWR cache
      mutate('/api/timeline');
      mutate(`/api/timeline?chatId=${chatId}`);
      mutate('/api/timeline/pending');
      
      // No success message needed
    } catch (error) {
      console.error('Error updating timeline status:', error);
      // Handle error silently
    }
  };

  // Both Schreiber and Supplier now use the same timeline view
  // Just changing the colors slightly for supplier mode
  const timelineBackground = mode === 'supplier' ? 'bg-blue-50' : 'bg-zinc-100';
  const timelineBorder = mode === 'supplier' ? 'border-blue-100' : 'border-zinc-200';
  
  // We'll still keep the action buttons for supplier mode
  let actionButtons = null;
  
  if (mode === 'supplier') {
    if (isSendInProgress) {
      actionButtons = (
        <Button 
          size="sm" 
          variant="default"
          onClick={handleProvideFeedback}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Submit for Review
        </Button>
      );
    } else if (isFeedbackInProgress) {
      actionButtons = (
        <div className="flex items-center gap-2">
          {missingFields > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  // Fetch the latest sheet artifact
                  const artifactRes = await fetch(`/api/artifacts?chatId=${chatId}&kind=sheet`);
                  if (artifactRes.ok) {
                    const artifacts = await artifactRes.json();
                    if (artifacts && artifacts.length > 0) {
                      const latestSheet = artifacts[0];
                      
                      // Open the artifact panel
                      setArtifact({
                        documentId: latestSheet.id || 'sheet-view',
                        title: latestSheet.title || 'Specification Sheet',
                        kind: 'sheet',
                        content: latestSheet.content || '',
                        isVisible: true,
                        status: 'idle',
                        boundingBox: {
                          top: 0,
                          left: 0,
                          width: 0,
                          height: 0
                        }
                      });
                    }
                  }
                } catch (error) {
                  console.error('Error fetching sheet:', error);
                }
              }}
              className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
            >
              Open Sheet
            </Button>
          )}
          <Button 
            size="sm" 
            variant="default"
            onClick={handleCompleteFeedback}
            className="bg-green-600 hover:bg-green-700"
            disabled={missingFields > 0}
            title={missingFields > 0 ? "Please complete all missing fields first" : "Complete your feedback"}
          >
            Complete
          </Button>
        </div>
      );
    }
  }
  
  // Unified rendering for both Schreiber and Supplier modes
  return (
    <div className={`w-full ${timelineBackground} border-b ${timelineBorder} px-4 py-3`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium mb-2">Supplier Specification Timeline</h3>
          <div className="flex items-center">
            {timeline.steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <TimelineStep step={step} />
                {index < timeline.steps.length - 1 && (
                  <div className={cn(
                    "h-px w-8 mx-1", 
                    step.status === 'completed' ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Action buttons area */}
        {actionButtons && (
          <div className="ml-4">
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineStep({ step }: { step: { id: string; label: string; status: string; timestamp?: string } }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div 
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            step.status === 'completed' ? "bg-primary text-primary-foreground" : 
            step.status === 'in-progress' ? "bg-primary/20 text-primary border border-primary" : 
            "bg-muted text-muted-foreground"
          )}
        >
          {step.status === 'completed' ? (
            <CheckCircleFillIcon size={12} />
          ) : step.status === 'in-progress' ? (
            <ClockRewind size={12} />
          ) : (
            <span className="w-2 h-2 rounded-full bg-current" />
          )}
        </div>
      </div>
      <div className="mt-1 text-xs max-w-16 text-center">
        {step.label}
      </div>
      {step.timestamp && (
        <div className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(step.timestamp), { addSuffix: true })}
        </div>
      )}
    </div>
  );
} 