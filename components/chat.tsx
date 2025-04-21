
// @ts-nocheck
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
import { useSearchParams } from 'next/navigation';

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
  
  // Check for schreiberApproval query parameter
  const searchParams = useSearchParams();
  const isSchreiberApproval = searchParams.get('schreiberApproval') === 'true';
  
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
    error
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel, userMode: mode },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      console.log("[CHAT] Chat finished successfully");
    },
    onError: (error) => {
      console.error("[CHAT] Error from useChat:", error);
      toast.error(`Error: ${error?.message || 'An error occurred, please try again!'}`);
    },
  });
  
  // Add debug logging for message state
  useEffect(() => {
    if (messages.length > 0) {
      console.log(`[CHAT] Messages updated (${messages.length} total):`, 
        messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content.substring(0, 30) + '...' : 'Non-string content',
          partsCount: m.parts?.length || 0,
          hasAttachments: !!m.experimental_attachments,
          attachmentsCount: m.experimental_attachments?.length || 0
        }))
      );
    }
    
    // Show detailed error if any
    if (error) {
      console.error('[CHAT] Current error state:', error);
    }
  }, [messages, error]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  // Dynamic attachments from user's uploaded PDFs
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  
  // Load PDFs when component mounts
  useEffect(() => {
    async function loadPDFs() {
      try {
        // Don't use sessionStorage to determine if PDFs should be loaded
        // This was preventing PDFs from being loaded on page refresh
        
        // First try to get files from the user's uploads
        const response = await fetch('/api/files?type=application/pdf');
        
        if (response.ok) {
          const files = await response.json();
          
          if (files && files.length > 0) {
            console.log("[CHAT] Found user PDFs:", files);
            
            // Use the actual file URLs from Vercel Blob storage
            const pdfAttachments = files.map(file => ({
              name: file.fileName,
              url: file.fileUrl, // This is an absolute URL to Vercel Blob
              contentType: file.fileType
            }));
            
            setAttachments(pdfAttachments);
            console.log("[CHAT] Using user's uploaded PDFs:", pdfAttachments);
            return;
          }
        }
        
        console.log("[CHAT] No user PDFs found");
        setAttachments([]);
      } catch (error) {
        console.error("[CHAT] Error loading PDFs:", error);
        // Fallback to empty attachments on error
        setAttachments([]);
      }
    }
    
    loadPDFs();
  }, []);
  
  // Add a wrapper around append to include the senderMode and attachments
  const appendWithMode = (message: any) => {
    // Only user messages need a senderMode and attachments
    if (message.role === 'user') {
      try {
        console.log("[APPEND] Before processing message:", JSON.stringify(message));
        
        // Only add attachments to the first message in the conversation
        const isFirstMessage = messages.length === 0;
        
        // Create the message with proper mode
        const messageWithMode = {
          ...message,
          senderMode: mode, // Current user mode (supplier or schreiber)
          // Always include attachments if this is the first message and we have attachments
          ...(isFirstMessage && attachments.length > 0 
              ? { experimental_attachments: attachments } 
              : {})
        };
        
        if (isFirstMessage && attachments.length > 0) {
          console.log("[APPEND] First message - adding attachments:", attachments);
        } else if (isFirstMessage) {
          console.log("[APPEND] First message but no attachments available");
        } else {
          console.log("[APPEND] Not first message - skipping attachments");
        }
        
        console.log("[APPEND] Final message to send:", JSON.stringify(messageWithMode));
        return append(messageWithMode);
      } catch (error) {
        console.error("[APPEND] Error appending user message:", error);
        toast.error("Error sending message");
        // Return a rejected promise instead of null to maintain type compatibility
        return Promise.reject(error);
      }
    }
    
    // For non-user messages, just pass through
    return append(message);
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
        "flex flex-col min-w-0 h-dvh bg-background bg-[url(/images/dark-background.webp)] bg-cover bg-top-right bg-fixed overflow-hidden"
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
          isSchreiberApproval={isSchreiberApproval}
        />

        <form className="flex mx-auto px-4 bg-none pb-4 md:pb-6 gap-2 w-full md:max-w-3xl flex-col">
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
        isSchreiberApproval={isSchreiberApproval}
      />
    </MessageModeContext.Provider>
  );
}
