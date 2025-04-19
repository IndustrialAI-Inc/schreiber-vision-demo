'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { SupplierTimeline } from './supplier-timeline';
import { useUserMode, MessageModeContext } from './mode-toggle';
import { SupplierSheetAnalysis } from './supplier-sheet-analysis';
import { cn } from '@/lib/utils';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const { mode } = useUserMode();
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const [sheetContent, setSheetContent] = useState<string>('');
  
  // When switching modes, this state ensures existing messages don't suddenly change position
  // Messages will always maintain their original mode/position
  const [messageModeOverride, setMessageModeOverride] = useState<null | 'supplier' | 'schreiber'>(null);
  
  // Use this effect to stabilize message appearance during mode transitions
  useEffect(() => {
    // When mode changes, briefly lock the message appearance with the previous mode
    // This prevents message jumping during mode transition
    const prevMode = messageModeOverride || mode;
    setMessageModeOverride(prevMode);
    
    // After transition animation would be complete, unlock
    const timer = setTimeout(() => {
      setMessageModeOverride(null);
    }, 200); // Typical transition time
    
    return () => clearTimeout(timer);
  }, [mode, messageModeOverride]);
  
  // Fetch sheet content for supplier analysis
  useEffect(() => {
    if (mode === 'supplier' && id) {
      // Check if we're in feedback mode before fetching
      const checkTimelineAndFetch = async () => {
        try {
          const timelineRes = await fetch(`/api/timeline?chatId=${id}`);
          const timeline = await timelineRes.json();
          
          // Only fetch sheet if we're in feedback mode
          const isFeedbackInProgress = timeline?.steps?.some(
            (step: {id: string, status: string}) => 
              step.id === 'feedback' && step.status === 'in-progress'
          );
          
          if (isFeedbackInProgress) {
            // Attempt to fetch the latest sheet artifact for this chat
            fetch(`/api/artifacts?chatId=${id}&kind=sheet`)
              .then(res => res.json())
              .then(data => {
                if (data && data.length > 0) {
                  // Get the latest sheet
                  const latestSheet = data[0];
                  setSheetContent(latestSheet.content || '');
                }
              })
              .catch(err => {
                console.error('Error fetching sheet content:', err);
              });
          }
        } catch (error) {
          console.error('Error checking timeline status:', error);
        }
      };
      
      checkTimelineAndFetch();
    }
  }, [id, mode]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel, userMode: mode },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: () => {
      toast.error('An error occurred, please try again!');
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  
  // Add a wrapper around append to include the senderMode
  const appendWithMode = (message: any) => {
    // Only user messages need a senderMode
    if (message.role === 'user') {
      // Add the current mode to the message
      const messageWithMode = {
        ...message,
        senderMode: mode // Current user mode (supplier or schreiber)
      };
      return append(messageWithMode);
    } else {
      // Assistant messages don't need a senderMode
      return append({...message});
    }
  };

  // Handler for when supplier sends feedback
  const handleSendFeedback = (feedback: string) => {
    appendWithMode({
      role: 'user',
      content: `**SUPPLIER FEEDBACK:**\n\n${feedback}`,
    });
  };

  return (
    <MessageModeContext.Provider value={{ messageModeOverride }}>
      <div className={cn(
        "flex flex-col min-w-0 h-dvh bg-background"
      )}>
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <SupplierTimeline chatId={id} />

        {mode === 'supplier' && sheetContent && (
          <SupplierSheetAnalysis
            chatId={id}
            sheetContent={sheetContent}
            append={append}
          />
        )}

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl flex-col">
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            status={status}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            setMessages={setMessages}
            append={appendWithMode}
            disabled={isReadonly}
            supplierMode={mode === 'supplier'}
            className={cn(
              'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base pb-10 dark:border-zinc-700',
              mode === 'supplier'
                ? 'bg-blue-50 border-blue-200 text-black'
                : 'bg-muted border-zinc-200 text-black',
            )}
          />
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={appendWithMode}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </MessageModeContext.Provider>
  );
}
