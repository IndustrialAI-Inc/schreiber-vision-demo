'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSupplierTimeline } from '@/hooks/use-supplier-timeline';
import { toast } from 'sonner';
import { mutate } from 'swr';

interface SupplierFeedbackInputProps {
  chatId: string;
  onSendFeedback: (feedback: string) => void;
}

export function SupplierFeedbackInput({ chatId, onSendFeedback }: SupplierFeedbackInputProps) {
  const [feedback, setFeedback] = useState('');
  const { timeline, updateStepStatus } = useSupplierTimeline(chatId);
  
  // Check if feedback step is in progress
  const isFeedbackInProgress = timeline?.steps.some(
    step => step.id === 'feedback' && step.status === 'in-progress'
  );
  
  if (!isFeedbackInProgress) {
    return null;
  }
  
  const handleSendFeedback = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter feedback before sending');
      return;
    }
    
    try {
      // Send the feedback
      onSendFeedback(feedback);
      
      // Clear the input
      setFeedback('');
      
      // Mark feedback step as completed
      await updateStepStatus('feedback', 'completed');
      
      // Update SWR cache
      mutate('/api/timeline');
      mutate(`/api/timeline?chatId=${chatId}`);
      mutate('/api/timeline/pending');
      
      toast.success('Feedback sent successfully');
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast.error('Failed to send feedback');
    }
  };
  
  return (
    <div className="flex flex-col gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <h3 className="font-medium text-sm">Supplier Feedback</h3>
      <Textarea
        placeholder="Enter your feedback on the specification..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="flex justify-end">
        <Button onClick={handleSendFeedback}>
          Send Feedback
        </Button>
      </div>
    </div>
  );
} 