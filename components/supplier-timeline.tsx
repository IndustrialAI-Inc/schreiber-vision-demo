'use client';

import { CheckCircleFillIcon, ClockRewind } from '@/components/icons';
import { useSupplierTimeline } from '@/hooks/use-supplier-timeline';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface SupplierTimelineProps {
  chatId: string;
}

export function SupplierTimeline({ chatId }: SupplierTimelineProps) {
  // For debugging path extraction
  const pathname = usePathname();
  console.log('Path extraction:', { pathname, passedChatId: chatId });
  
  const { timeline, isTimelineVisible } = useSupplierTimeline(chatId);
  
  // For debugging
  console.log('SupplierTimeline rendering:', { 
    chatId, 
    isVisible: timeline?.isVisible, 
    isTimelineVisible,
    steps: timeline?.steps 
  });
  
  // Only show if this chat's timeline is visible
  if (!isTimelineVisible) return null;
  
  return (
    <div className="w-full bg-zinc-100 border-b px-4 py-3">
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