'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserMode } from "./mode-toggle";
import { fetcher } from '@/lib/utils';
import useSWR from "swr";
import { motion } from 'framer-motion';

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
  
  // Fetch timelines for both supplier and schreiber modes
  const { data: timelines, error } = useSWR<Timeline[]>(
    mounted ? '/api/timeline/pending' : null,
    fetcher,
    { refreshInterval: 10000 } // Refresh every 10 seconds
  );
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted || !timelines || timelines.length === 0) {
    return null;
  }
  
  // Different filters based on user mode
  const pendingTasks = timelines.filter(timeline => {
    if (mode === 'supplier') {
      // For suppliers, show tasks where send is in-progress (waiting for their feedback)
      return timeline.steps.some(step => 
        (step.id === 'send' && step.status === 'in-progress')
      );
    } else {
      // For Schreiber users, show tasks in these scenarios:
      // 1. Where feedback is in-progress (suppliers have submitted feedback)
      // 2. Where send is completed (just submitted to supplier)
      return timeline.steps.some(step => 
        (step.id === 'feedback' && step.status === 'in-progress') ||
        (step.id === 'send' && step.status === 'in-progress')
      );
    }
  });
  
  console.log('Mode:', mode, 'Pending tasks:', pendingTasks.length, 'All timelines:', timelines.length);
  
  if (pendingTasks.length === 0) {
    return null;
  }
  
  // Set different styles based on user mode
  const styles = {
    bg: mode === 'supplier' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20',
    border: mode === 'supplier' ? 'border-red-200 dark:border-red-800' : 'border-emerald-200 dark:border-emerald-800',
    icon: mode === 'supplier' ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400',
    text: mode === 'supplier' ? 'text-red-900 dark:text-red-100' : 'text-emerald-900 dark:text-emerald-100',
    button: mode === 'supplier' ? 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/50' : 
                                'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
  };
  
  // Different message based on user mode and status
  let message = '';
  if (mode === 'supplier') {
    message = 'Specification from Schreiber needs your review';
  } else {
    // Check if this is feedback or just sent to supplier
    const hasFeedback = pendingTasks.some(task => 
      task.steps.some(step => step.id === 'feedback' && step.status === 'in-progress')
    );  
    
    message = hasFeedback 
      ? 'California Custom Fruit & Flavor has submitted feedback for review'
      : 'Specification sent to California Custom Fruit & Flavor for review';
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: 0.85,
        duration: 0.5,
        ease: "easeOut"
      }}
    >
      <div className={`${styles.bg} border ${styles.border} rounded-lg shadow-sm p-4 max-w-md animate-fadeIn transition-all duration-300`}>
        <div className="flex items-start">
          <div className="shrink-0 pt-0.5">
            <ClipboardIcon className={`size-5 ${styles.icon}`} />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${styles.text}`}>
              {message}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className={`text-xs ${styles.button}`}
                onClick={() => {
                  if (pendingTasks[0].chatId) {
                    router.push(`/chat/${pendingTasks[0].chatId}`);
                  }
                }}
              >
                View Details
              </Button>
              {pendingTasks.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={`text-xs ${styles.text} opacity-80`}
                >
                  {`+${pendingTasks.length - 1} more`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 