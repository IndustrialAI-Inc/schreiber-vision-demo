'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { parse } from 'papaparse';
import { useUserMode } from './mode-toggle';
import { useSupplierTimeline } from '@/hooks/use-supplier-timeline';
import type { UseChatHelpers } from '@ai-sdk/react';
import { ClipboardCheckIcon } from 'lucide-react';

interface SupplierSheetAnalysisProps {
  chatId: string;
  sheetContent: string;
  append: UseChatHelpers['append'];
}

export function SupplierSheetAnalysis({ 
  chatId, 
  sheetContent, 
  append 
}: SupplierSheetAnalysisProps) {
  const { mode } = useUserMode();
  const { timeline } = useSupplierTimeline(chatId);
  const [emptyFields, setEmptyFields] = useState<string[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  // Only show for suppliers and when in the feedback step
  const isFeedbackInProgress = timeline?.steps.some(
    step => step.id === 'feedback' && step.status === 'in-progress'
  );
  
  // Check if there was a previous message about missing fields
  useEffect(() => {
    // Only check once when mounted
    const checkForPreviousMessages = () => {
      const chatMessages = document.querySelectorAll('[data-message-role="assistant"]');
      for (const message of chatMessages) {
        const content = message.textContent || '';
        if (content.includes('Missing Information Detected')) {
          setHasAnalyzed(true);
          break;
        }
      }
    };
    
    if (isFeedbackInProgress) {
      setTimeout(checkForPreviousMessages, 500);
    }
  }, [isFeedbackInProgress]);
  
  // Analyze the sheet for empty answers
  useEffect(() => {
    if (mode !== 'supplier' || !sheetContent || !isFeedbackInProgress) return;
    
    try {
      const result = parse<string[]>(sheetContent, { skipEmptyLines: true });
      const missingFields: string[] = [];
      
      // Check for empty answers (assuming a sheet with ID, Question, Answer, Source columns)
      result.data.forEach((row, index) => {
        // Skip header row
        if (index === 0) return;
        
        // If the row has an ID and question but no answer
        if (row[0] && row[1] && (!row[2] || row[2].trim() === '')) {
          missingFields.push(row[1]);
        }
      });
      
      setEmptyFields(missingFields);
      
      // If there are empty fields and we haven't sent a message yet, send one
      if (missingFields.length > 0 && !hasAnalyzed) {
        // Add a delay to make sure the message appears after other messages
        setTimeout(() => {
          setHasAnalyzed(true);
          
          // Create a message listing the missing fields
          let message = `**Missing Information Detected**\n\nI've identified ${missingFields.length} question${missingFields.length > 1 ? 's' : ''} that need${missingFields.length === 1 ? 's' : ''} your attention:\n\n`;
          
          // List the first 5 questions at most
          const displayFields = missingFields.slice(0, 5);
          displayFields.forEach((field, index) => {
            message += `${index + 1}. ${field}\n`;
          });
          
          if (missingFields.length > 5) {
            message += `\n...and ${missingFields.length - 5} more.`;
          }
          
          message += '\n\nPlease review the specification and provide these answers in your feedback.';
          
          // Send as assistant message
          append({
            role: 'assistant',
            content: message,
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error analyzing sheet:', error);
    }
  }, [sheetContent, mode, isFeedbackInProgress, append, hasAnalyzed]);
  
  // For the standalone component, we'll only show it if there are fields to fill
  // and we haven't handled it through the timeline
  if (mode !== 'supplier' || !isFeedbackInProgress || emptyFields.length === 0) {
    return null;
  }
  
  const handleReviewSheet = () => {
    // Scroll to the sheet UI which is usually in an artifact area
    const sheetElement = document.querySelector('[data-artifact="sheet"]');
    if (sheetElement) {
      sheetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="p-4 mb-4 border border-amber-200 bg-amber-50 rounded-lg">
      <h3 className="font-medium mb-2">Incomplete Specification</h3>
      <p className="mb-3 text-sm">
        This specification has {emptyFields.length} unanswered question{emptyFields.length !== 1 ? 's' : ''}.
        Please review the red highlighted fields and provide answers in your feedback.
      </p>
      <Button 
        onClick={handleReviewSheet}
        variant="outline"
        className="bg-white border-amber-300 hover:bg-amber-100"
        size="sm"
      >
        <ClipboardCheckIcon className="mr-2 h-4 w-4" />
        Review Missing Fields
      </Button>
    </div>
  );
} 