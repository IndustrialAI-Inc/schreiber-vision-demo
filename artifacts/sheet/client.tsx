import { Artifact } from '@/components/create-artifact';
import {
  CopyIcon,
  LineChartIcon,
  RedoIcon,
  SparklesIcon,
  UndoIcon,
  ShareIcon,
  CheckCircleFillIcon,
  CheckmarkIcon
} from '@/components/icons';
import { SpreadsheetEditor } from '@/components/sheet-editor';
import { parse, unparse } from 'papaparse';
import { toast } from 'sonner';
import { TimelineStep } from '@/hooks/use-supplier-timeline';
import { mutate } from 'swr';

type Metadata = any;

export const sheetArtifact = new Artifact<'sheet', Metadata>({
  kind: 'sheet',
  description: 'Useful for working with spreadsheets',
  initialize: async () => {},
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type === 'sheet-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  content: ({
    content,
    currentVersionIndex,
    isCurrentVersion,
    onSaveContent,
    status,
  }) => {
    return (
      <SpreadsheetEditor
        content={content}
        currentVersionIndex={currentVersionIndex}
        isCurrentVersion={isCurrentVersion}
        saveContent={onSaveContent}
        status={status}
      />
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <CopyIcon />,
      description: 'Copy as .csv',
      onClick: ({ content }) => {
        const parsed = parse<string[]>(content, { skipEmptyLines: true });

        const nonEmptyRows = parsed.data.filter((row) =>
          row.some((cell) => cell.trim() !== ''),
        );

        const cleanedCsv = unparse(nonEmptyRows);

        navigator.clipboard.writeText(cleanedCsv);
        toast.success('Copied csv to clipboard!');
      },
    },
  ],
  toolbar: [
    {
      description: 'Send to Supplier',
      icon: <CheckmarkIcon />,
      onClick: async ({ chatId }) => {
        try {
          if (!chatId) {
            toast.error('Missing chat ID');
            return;
          }

          console.log('Starting send to supplier with chatId:', chatId);
          
          // Initial timeline data with JSON string steps
          const steps = [
            {
              id: 'prepare',
              label: 'Prepare specifications',
              status: 'completed',
              timestamp: new Date().toISOString(),
            },
            {
              id: 'review',
              label: 'Internal review',
              status: 'completed',
              timestamp: new Date().toISOString(),
            },
            {
              id: 'send',
              label: 'Send to supplier',
              status: 'in-progress',
              timestamp: new Date().toISOString(),
            },
            {
              id: 'feedback',
              label: 'Supplier feedback',
              status: 'pending',
            },
            {
              id: 'finalize',
              label: 'Finalize specifications',
              status: 'pending',
            },
          ];
          
          console.log('Sending timeline data:', { chatId, steps });
          
          // Create or update timeline in database
          const response = await fetch('/api/timeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId,
              isVisible: true,
              steps,
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('API error:', response.status, errorText);
            throw new Error(`Failed to update timeline: ${response.status} ${errorText}`);
          }
          
          const result = await response.json();
          console.log('Timeline create/update result:', result);
          
          // Update SWR cache
          mutate('/api/timeline');
          if (chatId) {
            mutate(`/api/timeline?chatId=${chatId}`);
          }
          
          // Notify the user
          toast.success('Specification sent to supplier for review');
        } catch (error) {
          console.error('Error updating timeline:', error);
          toast.error(`Failed to send specification: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },
    },
    {
      description: 'Analyze and visualize data',
      icon: <LineChartIcon />,
      onClick: async ({ chatId, appendMessage }) => {
        try {
          // Check if timeline exists for this chat
          if (chatId) {
            const response = await fetch(`/api/timeline?chatId=${chatId}`);
            if (response.ok) {
              const timeline = await response.json();
              
              // If timeline exists and is visible, update it
              if (timeline) {
                const updatedSteps = timeline.steps.map((step: TimelineStep) => {
                  if (step.id === 'review') {
                    return { ...step, status: 'completed', timestamp: new Date().toISOString() };
                  }
                  if (step.id === 'send') {
                    return { ...step, status: 'in-progress', timestamp: new Date().toISOString() };
                  }
                  return step;
                });
                
                // Update timeline
                const updateResponse = await fetch('/api/timeline', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chatId,
                    isVisible: true,
                    steps: updatedSteps,
                  }),
                });
                
                if (updateResponse.ok) {
                  // Update SWR cache
                  mutate('/api/timeline');
                  mutate(`/api/timeline?chatId=${chatId}`);
                  
                  toast.success('Specification analysis complete, preparing to send');
                }
              }
            }
          }
          
          // Always append the message for analysis
          appendMessage({
            role: 'user',
            content:
              'Can you please analyze and visualize the data by creating a new code artifact in python?',
          });
        } catch (error) {
          console.error('Error updating timeline:', error);
          
          // Fallback to just append the message
          appendMessage({
            role: 'user',
            content:
              'Can you please analyze and visualize the data by creating a new code artifact in python?',
          });
        }
      },
    },
    {
      description: 'Double check the specification',
      icon: <SparklesIcon />,
      onClick: async ({ chatId, appendMessage }) => {
        try {
          // Check if timeline exists for this chat
          if (chatId) {
            const response = await fetch(`/api/timeline?chatId=${chatId}`);
            if (response.ok) {
              const timeline = await response.json();
              
              // If timeline exists and is visible, update it
              if (timeline) {
                const updatedSteps = timeline.steps.map((step: TimelineStep) => {
                  if (step.id === 'prepare') {
                    return { ...step, status: 'completed', timestamp: new Date().toISOString() };
                  }
                  if (step.id === 'review') {
                    return { ...step, status: 'in-progress', timestamp: new Date().toISOString() };
                  }
                  return step;
                });
                
                // Update timeline
                const updateResponse = await fetch('/api/timeline', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chatId,
                    isVisible: true,
                    steps: updatedSteps,
                  }),
                });
                
                if (updateResponse.ok) {
                  // Update SWR cache
                  mutate('/api/timeline');
                  mutate(`/api/timeline?chatId=${chatId}`);
                  
                  toast.success('Specification review started');
                  return;
                }
              }
            }
          }
          
          // Fallback: Send the message if the timeline doesn't exist
          appendMessage({
            role: 'user',
            content: 'Can you please double check the answers in this specification sheet with the documents?',
          });
        } catch (error) {
          console.error('Error updating timeline:', error);
          
          // Fallback to just append the message
          appendMessage({
            role: 'user',
            content: 'Can you please double check the answers in this specification sheet with the documents?',
          });
        }
      },
    },
  ],
});
