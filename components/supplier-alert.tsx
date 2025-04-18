'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { useUserMode } from '@/components/mode-toggle';
import { fetcher } from '@/lib/utils';
import useSWR from 'swr';

interface Timeline {
  id: string;
  chatId: string;
  isVisible: boolean;
  steps: Array<{
    id: string;
    label: string;
    status: string;
    timestamp?: string;
  }>;
  lastUpdated: string;
}

export function SupplierAlert() {
  const { mode } = useUserMode();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Only fetch timelines in supplier mode
  const { data: timelines, error } = useSWR<Timeline[]>(
    mode === 'supplier' ? '/api/timeline/pending' : null,
    fetcher,
    { refreshInterval: 10000 } // Refresh every 10 seconds
  );
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted || mode !== 'supplier' || !timelines || timelines.length === 0) {
    return null;
  }
  
  const pendingTasks = timelines.filter(timeline => 
    timeline.steps.some(step => 
      (step.id === 'send' && step.status === 'in-progress') || 
      (step.id === 'feedback' && step.status === 'in-progress')
    )
  );
  
  if (pendingTasks.length === 0) {
    return null;
  }
  
  const handleAlertClick = () => {
    if (pendingTasks.length > 0) {
      router.push(`/chat/${pendingTasks[0].chatId}`);
    }
  };
  
  return (
    <Alert className="mb-4 bg-yellow-50 border-yellow-200">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">Attention Required</AlertTitle>
      <div className="flex justify-between items-center">
        <AlertDescription className="text-yellow-700">
          You have {pendingTasks.length} specification{pendingTasks.length > 1 ? 's' : ''} that need{pendingTasks.length === 1 ? 's' : ''} your review.
        </AlertDescription>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
          onClick={handleAlertClick}
        >
          Review <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
} 