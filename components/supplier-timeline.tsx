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

interface SupplierTimelineProps {
  chatId: string;
}

export function SupplierTimeline({ chatId }: SupplierTimelineProps) {
  // For debugging path extraction
  const pathname = usePathname();
  const { mode } = useUserMode();
  
  console.log('Path extraction:', { pathname, passedChatId: chatId });
  
  const { timeline, isTimelineVisible, updateStepStatus } = useSupplierTimeline(chatId);
  
  // For debugging
  console.log('SupplierTimeline rendering:', { 
    chatId, 
    isVisible: timeline?.isVisible, 
    isTimelineVisible,
    steps: timeline?.steps 
  });
  
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
  
  // Handler for when supplier provides feedback
  const handleProvideFeedback = async () => {
    try {
      // Mark send as completed and feedback as in-progress
      await updateStepStatus('send', 'completed');
      await updateStepStatus('feedback', 'in-progress');
      
      // Update SWR cache
      mutate('/api/timeline');
      mutate(`/api/timeline?chatId=${chatId}`);
      mutate('/api/timeline/pending');
      
      toast.success('Status updated to providing feedback');
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
        
        {mode === 'supplier' && isSendInProgress && (
          <Button 
            size="sm" 
            variant="default"
            onClick={handleProvideFeedback}
          >
            Begin Providing Feedback
          </Button>
        )}
        
        {mode === 'supplier' && isFeedbackInProgress && (
          <Button 
            size="sm" 
            variant="default"
            onClick={handleCompleteFeedback}
          >
            Complete Feedback
          </Button>
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