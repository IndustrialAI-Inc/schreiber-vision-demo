// @ts-nocheck
'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef, useMemo } from 'react';
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

// Table renderer for structured search results
interface TableData {
  columns: string[];
  rows: string[][];
}

function AnswerTable({ data }: { data: TableData | null }) {
  if (!data) return null;

  const { columns, rows } = data;

  return (
    <table className="w-full text-sm border border-zinc-700 mb-4 animate-fade-in">
      <thead className="bg-zinc-800 text-zinc-100">
        <tr>
          {columns.map((column: string) => (
            <th key={`col-${column}`} className="p-2 text-left">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((row: string[], rowIndex: number) => (
            <tr
              key={`row-${rowIndex}-${row[0] || 'empty'}`}
              className="even:bg-zinc-900 hover:bg-zinc-800"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}-${cell}`}
                  className="p-2 break-all"
                >
                  {columns[cellIndex] === 'PDF' ? (
                    <a
                      href={cell}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-emerald-400"
                    >
                      link
                    </a>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length} className="p-3 italic">
              No matches.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

interface SearchChatProps {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}

export function SearchChat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: SearchChatProps) {
  const { mutate } = useSWRConfig();
  const { mode } = useUserMode();
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const [inputPosition, setInputPosition] = useState<'top' | 'bottom'>('top');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const reasoningRef = useRef<HTMLDivElement>(null);

  // Message mode override for consistent styling
  const [messageModeOverride, setMessageModeOverride] = useState<
    'supplier' | 'schreiber' | null
  >(null);

  const chatHelpers = useChat({
    id,
    body: { id, selectedChatModel, userMode: mode },
    initialMessages,
    experimental_throttle: 200,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      console.error('Search error:', error);
      toast.error(
        `Error: ${error?.message || 'An error occurred, please try again!'}`,
      );
    },
    api: '/search/api/search',
  });

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
  } = chatHelpers;

  // Mock reasoning for display (since it's not available in current useChat)
  const [reasoning] = useState<string[]>([]);

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
      window.history.replaceState({}, '', '/search');
    } else {
      setInputPosition('top');
    }
  }, [messages.length]);

  // Handle mode transitions
  useEffect(() => {
    const prevMode = messageModeOverride || mode;
    setMessageModeOverride(prevMode);

    const timer = setTimeout(() => {
      setMessageModeOverride(null);
    }, 200);

    return () => clearTimeout(timer);
  }, [mode, messageModeOverride]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  // No attachments needed - spec system searches all files automatically
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  // Check for reasoning display
  const hasReasoning =
    reasoning &&
    Array.isArray(reasoning) &&
    reasoning.length > 0 &&
    status === 'in_progress';

  // Simplified append function for spec-centric search
  const appendWithMode = async (message: UIMessage) => {
    if (message.role === 'user') {
      try {
        // In spec system, search automatically includes all spec files
        // No need to attach files manually
        const result = await append(message);
        return result;
      } catch (error) {
        console.error('Error sending search query:', error);
        toast.error('Error sending search query');
        return null;
      }
    } else {
      return append(message);
    }
  };

  // Process messages for display
  const processedMessages = useMemo(() => {
    return messages.map((message) => {
      if (message.role === 'assistant') {
        const content = message.content || '';

        // Check for function call format
        const functionMatch = content.match(
          /<function name="showTable">([\s\S]*?)<\/function>/,
        );

        if (functionMatch) {
          try {
            const jsonString = functionMatch[1]
              .replace(/,\s*]/g, ']')
              .replace(/,\s*}/g, '}')
              .replace(/](\s*)\[/g, '],[');

            try {
              const jsonData = JSON.parse(jsonString) as TableData;

              if (jsonData?.columns && jsonData?.rows) {
                const tableMessage = {
                  ...message,
                  parts: message.parts || [],
                  tableToolInvocation: {
                    toolName: 'showTable',
                    data: jsonData,
                  },
                };

                const newContent = content.replace(functionMatch[0], '');
                tableMessage.content = newContent.trim();

                return tableMessage;
              }
            } catch (parseError) {
              console.error('Error parsing JSON:', parseError);
              return {
                ...message,
                content: content.replace(/<function.*?<\/function>/gs, ''),
              };
            }
          } catch (e) {
            console.error('Error processing function call:', e);
            return {
              ...message,
              content: content.replace(/<function.*?<\/function>/gs, ''),
            };
          }
        }
      }
      return message;
    });
  }, [messages]);

  return (
    <MessageModeContext.Provider value={{ messageModeOverride }}>
      <div
        className={cn(
          'flex flex-col min-w-0 min-h-dvh bg-none overflow-visible search-page bg-[url(/images/dark-background.webp)] bg-cover bg-top-right bg-fixed',
        )}
      >
        {/* Top search input */}
        {inputPosition === 'top' && (
          <div className="sticky top-0 z-10 max-w-3xl mx-auto w-full px-4 py-4 bg-none rounded-b-xl">
            <SearchMultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
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

        {/* Reasoning display */}
        {hasReasoning && (
          <div className="mx-auto max-w-3xl w-full px-4">
            <div
              ref={reasoningRef}
              className="px-4 py-2 bg-muted/50 my-3 rounded-md shadow-sm"
            >
              <MessageReasoning
                isLoading={true}
                reasoning={reasoning.join(' ')}
              />
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-grow mx-auto max-w-3xl w-full pb-24 px-4">
          {messages.length === 0 ? (
            <SuggestedSearches
              chatId={id}
              append={appendWithMode}
              disabled={isReadonly || status === 'loading'}
              setInput={setInput}
            />
          ) : (
            <Messages
              chatId={id}
              status={status}
              votes={votes}
              messages={processedMessages}
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
              isArtifactVisible={isArtifactVisible}
              isSchreiberApproval={false}
              renderTable={(data: TableData) => <AnswerTable data={data} />}
            />
          )}
        </div>

        {/* Bottom search input */}
        {inputPosition === 'bottom' && (
          <div
            className="sticky bottom-0 z-10 border-t border-border backdrop-blur-md bg-none mx-auto w-full"
            style={{
              position: 'fixed',
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: '768px',
            }}
          >
            {messages.length > 0 && (
              <SearchPills
                onPillClick={(pillQuery) => {
                  setInput(pillQuery);

                  appendWithMode({
                    role: 'user',
                    content: pillQuery,
                  });
                }}
                disabled={isReadonly || status === 'loading'}
                className="bg-none backdrop-blur-sm"
              />
            )}
            <SearchMultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
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
