import type { UIMessage } from 'ai';
import { memo, useMemo, useState } from 'react';
import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useUserMode } from './mode-toggle';
import type { UIArtifact } from './artifact';
import { useSupplierTimeline } from '@/hooks/use-supplier-timeline';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Database, Loader2 } from 'lucide-react';
import { useSchreiberSubmit } from '@/hooks/use-schreiber-submit';

interface ArtifactMessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  artifactStatus: UIArtifact['status'];
  isSchreiberApproval?: boolean;
}

function PureArtifactMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  isSchreiberApproval,
}: ArtifactMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
  const { mode } = useUserMode();

  // Get timeline data for this chat
  const { timeline } = useSupplierTimeline(chatId);
  
  // Track Optiva integration state
  const [isIntegrating, setIsIntegrating] = useState(false);
  
  // Get Schreiber submit state
  const { isSubmitted, submittedChatId } = useSchreiberSubmit();
  
  // Check if feedback is completed (supplier has submitted their feedback)
  const isFeedbackCompleted = timeline?.steps?.some(
    step => step.id === 'feedback' && step.status === 'completed'
  );
  
  // Check if there are previous messages (to avoid showing the button on empty chats)
  const hasPreviousMessages = messages.length > 0;

  // Check if approval is needed based on:
  // 1. The isSchreiberApproval prop (from URL param)
  // 2. The Schreiber submit state (from Zustand store)
  // 3. The timeline state (feedback completed, approval pending)
  // 4. Must have previous messages
  const isApprovalNeeded = hasPreviousMessages && (
    isSchreiberApproval || 
    (isSubmitted && submittedChatId === chatId) || 
    (isFeedbackCompleted && timeline?.steps?.some(
      step => step.id === 'approve' && step.status === 'pending'
    ))
  );
  
  // Handle the Optiva integration
  const handleOptivaIntegration = async () => {
    try {
      setIsIntegrating(true);
      
      // Simulate API call to Optiva
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Show success toast
      toast.success("Data successfully written to Optiva!", {
        duration: 5000,
      });
      
      // Reset states
      setIsIntegrating(false);
      
      // Reset the Schreiber submit state
      const resetSubmitted = useSchreiberSubmit.getState().resetSubmitted;
      resetSubmitted();
    } catch (error) {
      console.error('Error integrating with Optiva:', error);
      toast.error("Failed to write data to Optiva. Please try again.");
      setIsIntegrating(false);
    }
  };

  // Filter messages for supplier mode, similar to the Messages component
  const filteredMessages = useMemo(() => {
    // Special case for Schreiber mode when approval is needed
    if (mode === 'schreiber' && isApprovalNeeded) {
      // Find the sheet creation message
      const sheetCreationMessageIndex = messages.findIndex(message => {
        if (message.role === 'assistant') {
          const hasTool = message.parts?.some(part => 
            part.type === 'tool-invocation' && 
            part.toolInvocation?.toolName === 'createDocument' &&
            part.toolInvocation?.args?.kind === 'sheet'
          );
          return hasTool;
        }
        return false;
      });
      
      if (sheetCreationMessageIndex !== -1) {
        const sheetCreationMessage = messages[sheetCreationMessageIndex];
        
        // Get the tool parts from the sheet creation message
        const toolParts = sheetCreationMessage.parts?.filter(part => 
          part.type === 'tool-invocation'
        ) || [];
        
        // Create a new message with approval text
        const newParts = [
          { type: 'step-start' as const },
          {
            type: 'text' as const,
            text: "California Custom Fruit & Flavor has completed the specification form and it's ready for your approval. You can review the sheet and approve it to write the data to Optiva."
          },
          ...toolParts
        ];
        
        const approvalMessage = {
          ...sheetCreationMessage,
          parts: newParts
        };
        
        return [approvalMessage];
      }
      
      return [];
    }
    
    if (mode === 'supplier') {
      // In supplier mode, we want to find the sheet creation message
      const sheetCreationMessageIndex = messages.findIndex(message => {
        // Look for assistant messages with tool invocations
        if (message.role === 'assistant') {
          // Check for parts that might contain tool invocations
          const hasTool = message.parts?.some(part => 
            part.type === 'tool-invocation' && 
            part.toolInvocation?.toolName === 'createDocument' &&
            part.toolInvocation?.args?.kind === 'sheet'
          );
          return hasTool;
        }
        return false;
      });

      // If we found a sheet creation message
      if (sheetCreationMessageIndex !== -1) {
        const sheetCreationMessage = messages[sheetCreationMessageIndex];
        
        // First, check if there are any user messages after the sheet creation
        // This would indicate the user has started a conversation
        const hasUserMessagesAfterSheet = messages.slice(sheetCreationMessageIndex + 1)
          .some(msg => msg.role === 'user');
        
        // If user has already sent messages after the sheet was created,
        // only filter out messages before the sheet creation
        if (hasUserMessagesAfterSheet) {
          // Show the modified sheet creation message plus all messages after it
          const laterMessages = messages.slice(sheetCreationMessageIndex + 1);
          
          // Create our modified sheet message with the welcome text
          const toolParts = sheetCreationMessage.parts?.filter(part => 
            part.type === 'tool-invocation'
          ) || [];
          
          const newParts = [
            { type: 'step-start' as const },
            {
              type: 'text' as const,
              text: "Welcome! Please review and complete the specification sheet. Fill out any remaining questions to the best of your knowledge. If you need any clarification or have questions about any of the items, please don't hesitate to ask. I'm here to help make this process as smooth as possible for you."
            },
            ...toolParts
          ];
          
          const modifiedMessage = {
            ...sheetCreationMessage,
            parts: newParts
          };
          
          // Return the modified sheet message + all messages that came after
          return [modifiedMessage, ...laterMessages];
        } else {
          // If no conversation has started yet, just show the welcome message
          // Create our modified sheet message with the welcome text
          const toolParts = sheetCreationMessage.parts?.filter(part => 
            part.type === 'tool-invocation'
          ) || [];
          
          const newParts = [
            { type: 'step-start' as const },
            {
              type: 'text' as const,
              text: "Welcome! Please review and complete the specification sheet. Fill out any remaining questions to the best of your knowledge. If you need any clarification or have questions about any of the items, please don't hesitate to ask. I'm here to help make this process as smooth as possible for you."
            },
            ...toolParts
          ];
          
          const modifiedMessage = {
            ...sheetCreationMessage,
            parts: newParts
          };
          
          return [modifiedMessage];
        }
      }
      
      // If no sheet creation message found, return empty array
      return [];
    }
    
    // For Schreiber mode, show all messages
    return messages;
  }, [messages, mode, isApprovalNeeded]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
    >
      {filteredMessages.map((message, index) => (
        <PreviewMessage
          chatId={chatId}
          key={message.id}
          message={message}
          isLoading={status === 'streaming' && index === filteredMessages.length - 1}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      {/* Optiva Integration Button for Schreiber approval */}
      {mode === 'schreiber' && isApprovalNeeded && (
        <motion.div 
          className="flex ml-[-40px] justify-start px-4 mb-4 mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div 
            onClick={!isIntegrating ? handleOptivaIntegration : undefined}
            className={`rounded-[12px] bg-gradient-to-r from-mainred to-mainblue flex justify-center items-center p-0.5 w-[200px] h-[50px] ${!isIntegrating ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
          >
            <div className='flex flex-row items-center justify-center p-2 bg-[#313130] rounded-[10px] size-full'>
              {isIntegrating ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 size-4 animate-spin text-[#F6F6F6]" />
                  <span className='text-md text-[#F6F6F6]'>Writing to Optiva...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Database className="mr-2 size-4 text-[#F6F6F6]" />
                  <span className='text-md text-[#F6F6F6]'>Write to Optiva</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps,
) {
  if (
    prevProps.artifactStatus === 'streaming' &&
    nextProps.artifactStatus === 'streaming'
  )
    return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
}

export const ArtifactMessages = memo(PureArtifactMessages, areEqual);
