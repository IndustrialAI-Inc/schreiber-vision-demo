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
import { useUserMode } from './mode-toggle';
import { SupplierFeedbackInput } from './supplier-feedback-input';
import { SupplierSheetAnalysis } from './supplier-sheet-analysis';
import { useArtifact } from '@/hooks/use-artifact';
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
    body: { id, selectedChatModel: selectedChatModel },
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
  
  // Handler for when supplier sends feedback
  const handleSendFeedback = (feedback: string) => {
    append({
      role: 'user',
      content: `**SUPPLIER FEEDBACK:**\n\n${feedback}`,
    });
  };

  return (
    <>
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
          isReadonly={isReadonly || (mode === 'supplier')}
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
            append={append}
            disabled={isReadonly}
            supplierMode={mode === 'supplier'}
            className={cn(
              'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base pb-10 dark:border-zinc-700',
              mode === 'supplier' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-muted border-zinc-200',
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
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
