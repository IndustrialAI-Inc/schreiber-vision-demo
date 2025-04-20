import type { UIMessage } from 'ai';
import { memo, useMemo } from 'react';
import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useUserMode } from './mode-toggle';
import type { UIArtifact } from './artifact';

interface ArtifactMessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  artifactStatus: UIArtifact['status'];
}

function PureArtifactMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: ArtifactMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
  const { mode } = useUserMode();

  // Filter messages for supplier mode, similar to the Messages component
  const filteredMessages = useMemo(() => {
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
  }, [messages, mode]);

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
