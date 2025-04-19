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
  
  // Handler for when supplier provides feedback - enhanced to show artifacts
  const handleProvideFeedback = async () => {
    try {
      // Mark send as completed and feedback as in-progress
      await updateStepStatus('send', 'completed');
      await updateStepStatus('feedback', 'in-progress');
      
      // Update SWR cache
      mutate('/api/timeline');
      mutate(`/api/timeline?chatId=${chatId}`);
      mutate('/api/timeline/pending');
      
      // Make sure we have the sheet content
      if (chatId) {
        try {
          // Fetch the latest sheet artifact
          const artifactRes = await fetch(`/api/artifacts?chatId=${chatId}&kind=sheet`);
          if (artifactRes.ok) {
            const artifacts = await artifactRes.json();
            if (artifacts && artifacts.length > 0) {
              const latestSheet = artifacts[0];
              
              // Make the artifact panel visible with the sheet content
              setArtifact(current => ({
                ...current,
                kind: 'sheet',
                content: latestSheet.content || '',
                isVisible: true,
                status: 'idle'
              }));
              
              // Find the sheet element and scroll to it
              setTimeout(() => {
                const sheetElement = document.querySelector('[data-artifact="sheet"]');
                if (sheetElement) {
                  sheetElement.scrollIntoView({ behavior: 'smooth' });
                  
                  // Show toast guiding user what to do
                  if (missingFields > 0) {
                    toast.info(
                      `Please review the ${missingFields} highlighted question${missingFields !== 1 ? 's' : ''} that need${missingFields === 1 ? 's' : ''} your input.`,
                      { duration: 5000 }
                    );
                  }
                }
              }, 500);
            }
          }
        } catch (error) {
          console.error('Error fetching sheet artifact:', error);
        }
      }
      
      toast.success('Ready to provide feedback');
    } catch (error) {
      console.error('Error updating timeline status:', error);
      toast.error('Failed to update status');
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
      
      toast.success('Feedback completed successfully');
    } catch (error) {
      console.error('Error updating timeline status:', error);
      toast.error('Failed to update status');
    }
  };

  // Render a more compact version for supplier mode
  if (mode === 'supplier') {
    const currentStep = timeline.steps.find(step => step.status === 'in-progress')?.id || '';
    let stageText = "Reviewing Specification";
    let actionButton = null;
    
    if (isSendInProgress) {
      stageText = "Ready for review";
      actionButton = (
        <Button 
          size="sm" 
          variant="default"
          onClick={handleProvideFeedback}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Begin Providing Feedback
        </Button>
      );
    } else if (isFeedbackInProgress) {
      stageText = "Providing feedback";
      
      // Enhanced with missing fields information
      const missingFieldsText = missingFields > 0 
        ? ` (${missingFields} question${missingFields !== 1 ? 's' : ''} need${missingFields === 1 ? 's' : ''} review)` 
        : '';
      
      actionButton = (
        <div className="flex items-center gap-2">
          {missingFields > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Show artifact and scroll to sheet
                if (!artifact.isVisible) {
                  setArtifact(current => ({
                    ...current,
                    isVisible: true
                  }));
                }
                
                setTimeout(() => {
                  const sheetElement = document.querySelector('[data-artifact="sheet"]');
                  if (sheetElement) {
                    sheetElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }}
              className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
            >
              Review Missing Fields
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
            Complete Feedback
          </Button>
        </div>
      );
      
      // Update stage text with missing fields info
      if (missingFields > 0) {
        stageText = `Providing feedback${missingFieldsText}`;
      }
    }
    
    return (
      <div className="w-full bg-blue-50 border-b border-blue-100 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="font-medium">
              {stageText}
            </h3>
          </div>
          {actionButton}
        </div>
      </div>
    );
  }
  
  // Default rendering for Schreiber mode
  return (
    <div className="w-full bg-zinc-100 border-b px-4 py-3">
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