'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { SearchMultimodalInput } from '@/components/search-multimodal-input';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { createContext } from 'react';
import { useUserMode } from './mode-toggle';
import { cn } from '@/lib/utils';
import { MessageReasoning } from './message-reasoning';
import { SuggestedSearches } from './suggested-searches';
import { SearchPills } from './search-pills';

// Create a local message mode context for search page
const MessageModeContext = createContext<{
  messageModeOverride: 'supplier' | 'schreiber' | null;
}>({
  messageModeOverride: null,
});

export function SearchChat({
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
  const [query, setQuery] = useState('');
  const [inputPosition, setInputPosition] = useState<'top' | 'bottom'>('top');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const reasoningRef = useRef<HTMLDivElement>(null);

  // Message mode override for consistent styling
  const [messageModeOverride, setMessageModeOverride] = useState<null | 'supplier' | 'schreiber'>(null);
  
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
    error,
    reasoning,
  } = useChat({
    id,
    body: { id, selectedChatModel, userMode: mode },
    initialMessages,
    experimental_throttle: 200,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      console.log("[SEARCH] Search completed successfully");
    },
    onError: (error) => {
      console.error("[SEARCH] Error:", error);
      toast.error(`Error: ${error?.message || 'An error occurred, please try again!'}`);
    },
    experimental_sendReasoningMessages: false, // Hide reasoning in the final response
    api: '/search/api/search', // Uses our dedicated search endpoint with DeepSeek model
  });
  
  // Focus the search input when the page loads
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);
  
  // Move input to bottom after first message
  useEffect(() => {
    if (messages.length > 0) {
      setInputPosition('bottom');
      
      // Keep URL simple - don't include ID in URL
      window.history.replaceState({}, '', `/search`);
    } else {
      setInputPosition('top');
    }
  }, [messages.length]);

  // When switching modes, this state ensures existing messages don't suddenly change position
  useEffect(() => {
    const prevMode = messageModeOverride || mode;
    setMessageModeOverride(prevMode);
    
    const timer = setTimeout(() => {
      setMessageModeOverride(null);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [mode, messageModeOverride]);

  // Log message state for debugging
  useEffect(() => {
    if (messages.length > 0) {
      console.log(`[SEARCH] Messages updated (${messages.length} total):`, 
        messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content.substring(0, 30) + '...' : 'Non-string content',
          partsCount: m.parts?.length || 0,
          hasAttachments: !!m.experimental_attachments,
          attachmentsCount: m.experimental_attachments?.length || 0
        }))
      );
    }
    
    if (error) {
      console.error('[SEARCH] Current error state:', error);
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
        // Fetch all PDFs from Vercel Blob storage
        console.log("[SEARCH] Fetching PDFs from Vercel Blob storage...");
        const response = await fetch('/api/files?type=application/pdf');
        
        if (response.ok) {
          const files = await response.json();
          console.log("[SEARCH] API response:", files);
          
          if (files && files.length > 0) {
            console.log("[SEARCH] Found PDFs in Vercel Blob:", files);
            
            // Convert all PDFs from Vercel Blob to attachments format
            const pdfAttachments = files.map(file => ({
              name: file.fileName,
              url: file.fileUrl, // This is an absolute URL to Vercel Blob storage
              contentType: file.fileType
            }));
            
            // Set attachments for first message
            setAttachments(pdfAttachments);
            console.log("[SEARCH] Set attachments for first message");
          } else {
            console.log("[SEARCH] No PDFs found in API response");
          }
        } else {
          console.error("[SEARCH] API response was not OK:", response.status);
        }
      } catch (error) {
        console.error("[SEARCH] Error loading PDFs:", error);
        setAttachments([]);
      }
    }
    
    loadPDFs();
  }, []);
  
  // Add reasoning section above message handling when it's available
  const hasReasoning = reasoning && reasoning.length > 0 && status === 'loading';
  
  // Add a wrapper around append to include the senderMode and attachments
  const appendWithMode = async (message: any) => {
    // Only user messages need a senderMode and attachments
    if (message.role === 'user') {
      try {
        console.log("[SEARCH APPEND] Before processing message:", JSON.stringify(message));
        
        // Only add attachments to the first message in the conversation
        const isFirstMessage = messages.length === 0;
        
        // Always include PDFs for the first message
        let pdfAttachments = attachments;
        
        // If this is the first message, make sure we have PDFs
        if (isFirstMessage && (!attachments || attachments.length === 0)) {
          try {
            // Direct fetch for PDFs
            const response = await fetch('/api/files?type=application/pdf');
            
            if (response.ok) {
              const files = await response.json();
              
              if (files && files.length > 0) {
                // Convert all PDFs to attachments
                pdfAttachments = files.map(file => ({
                  name: file.fileName,
                  url: file.fileUrl,
                  contentType: file.fileType
                }));
                
                setAttachments(pdfAttachments);
                console.log("[SEARCH APPEND] Got PDF attachments directly:", pdfAttachments.length);
              }
            }
          } catch (error) {
            console.error("[SEARCH APPEND] Error fetching PDFs:", error);
          }
        }
        
        // Create message with mode and attachments
        const messageWithMode = {
          ...message,
          senderMode: mode,
          ...(isFirstMessage && pdfAttachments?.length > 0 
            ? { experimental_attachments: pdfAttachments } 
            : {})
        };
        
        console.log("[SEARCH APPEND] Submitting message with prompt to use requestPdf tool and search PDFs");
        
        // Prepare message with instructions to use requestPdf tool
        let originalQuery = messageWithMode.content;

        
        console.log("[SEARCH APPEND] Final message:", JSON.stringify(messageWithMode));
        const result = await append(messageWithMode);
        return result;
        
      } catch (error) {
        console.error("[SEARCH APPEND] Error appending message:", error);
        toast.error("Error sending search query");
        return null;
      }
    } else {
      return append({...message});
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || status === 'loading') return;
    
    // Store current query and immediately clear input field
    const currentQuery = query;
    setQuery(''); // Clear input immediately for better UX
    
    try {
      await appendWithMode({
        role: 'user',
        content: currentQuery,
      });
    } catch (err) {
      console.error('Error during search:', err);
    }
    
    // Clear input again to ensure it's empty after the search
    setQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  return (
    <MessageModeContext.Provider value={{ messageModeOverride }}>
      <div className={cn(
        "flex flex-col min-w-0 min-h-dvh bg-background bg-[url(/images/dark-background.webp)] bg-cover bg-top-right bg-fixed overflow-visible search-page"
      )}>
        {/* Top search input - only shown when inputPosition is 'top' */}
        {inputPosition === 'top' && (
          <div className="sticky top-0 z-10 max-w-3xl mx-auto w-full px-4 py-4 bg-background/60 backdrop-blur-md dark:bg-zinc-900/40 rounded-b-xl">
            <SearchMultimodalInput
              chatId={id}
              input={query}
              setInput={setQuery}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={appendWithMode}
              handleSubmit={handleSubmit}
              isSearchMode={true}
              disabled={isReadonly}
              supplierMode={false}
            />
            {/* Hide search pills when no messages (SuggestedSearches will show instead) */}
          </div>
        )}

        {/* Display reasoning during search */}
        {hasReasoning && (
          <div className="mx-auto max-w-3xl w-full px-4">
            <div ref={reasoningRef} className="px-4 py-2 bg-muted/50 my-3 rounded-md shadow-sm">
              <MessageReasoning isLoading={true} reasoning={reasoning} />
            </div>
          </div>
        )}

        <div className="flex-grow mx-auto max-w-3xl w-full pb-24 px-4">
          {messages.length === 0 ? (
            <SuggestedSearches
              chatId={id}
              append={appendWithMode}
              disabled={isReadonly || status === 'loading'}
              setInput={setQuery}
            />
          ) : (
            <Messages
              chatId={id}
              status={status}
              votes={votes}
              messages={messages}
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
              isArtifactVisible={isArtifactVisible}
              isSchreiberApproval={false}
            />
          )}
        </div>

        {/* Bottom search input - only shown when inputPosition is 'bottom' */}
        {inputPosition === 'bottom' && (
          <div className="sticky bottom-0 z-10 border-t border-border bg-background/60 backdrop-blur-md dark:bg-zinc-900/40 mx-auto w-full" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', maxWidth: '768px' }}>
            {/* Only show search pills in the bottom input when there are messages */}
            {messages.length > 0 && (
              <SearchPills 
                onPillClick={(pillQuery) => {
                  // Set the query in the input field for visibility
                  setQuery(pillQuery);
                  
                  // Then immediately execute the search
                  appendWithMode({
                    role: 'user',
                    content: pillQuery,
                  });
                }}
                disabled={isReadonly || status === 'loading'}
                className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md"
              />
            )}
            <SearchMultimodalInput
              chatId={id}
              input={query}
              setInput={setQuery}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={appendWithMode}
              handleSubmit={handleSubmit}
              isSearchMode={true}
              disabled={isReadonly}
              supplierMode={false}
            />
          </div>
        )}
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
        isSchreiberApproval={false}
      />
    </MessageModeContext.Provider>
  );
}
