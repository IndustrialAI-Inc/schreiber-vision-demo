'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useArtifact } from '@/hooks/use-artifact';
import React from 'react';
import { useUserMode, useMessageMode } from './mode-toggle';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const { setArtifact } = useArtifact();
  const { mode: userMode } = useUserMode();
  const { messageModeOverride } = useMessageMode();
  
  // During mode transitions, use the override to prevent flickering/jumping
  const effectiveUserMode = messageModeOverride || userMode;
  const isSupplierMode = effectiveUserMode === 'supplier';
  
  // Get sender mode directly from the message, with no fallbacks
  const messageSenderMode = (message as any).senderMode;
  
  // Determine message styling based only on the stored sender mode from the database
  const isSupplierMsg = message.role === 'user' && messageSenderMode === 'supplier';
  const isSchreiberMsg = message.role === 'user' && messageSenderMode === 'schreiber';
  
  // If no mode is set (for older messages), default to the current UI mode
  const isLegacyUserMsg = message.role === 'user' && !messageSenderMode;
  
  // Function to open PDF in artifact panel
  const openPdfInArtifactPanel = (pdfUrl: string, fileName: string, id: string) => {
    setArtifact({
      documentId: id || 'pdf-view',
      title: fileName || 'PDF Document',
      content: pdfUrl,
      kind: 'pdf',
      isVisible: true,
      status: 'idle',
      boundingBox: {
        top: 0,
        left: 0,
        width: 0,
        height: 0
      }
    });
  };

  const role = message.role;
  const hasArtifacts = (message as any).artifacts?.length > 0;

  return (
    <AnimatePresence initial={false}>
      <motion.div
        data-testid={`message-${role}`}
        className={cn(
          'w-full mx-auto max-w-3xl px-4 group/message message flex',
          {
            'justify-end': isSchreiberMsg || (isLegacyUserMsg && !isSupplierMode),
            'justify-start': isSupplierMsg || (isLegacyUserMsg && isSupplierMode) || message.role === 'assistant',
          }
        )}
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.1 } }}
        data-role={role}
        data-message-role={role}
      >
        <div
          className={cn(
            'flex gap-4',
            {
              'w-full justify-end': isSchreiberMsg || (isLegacyUserMsg && !isSupplierMode),
              'w-auto': isSupplierMsg || (isLegacyUserMsg && isSupplierMode),
              'w-full': message.role === 'assistant',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className={cn(
            "flex flex-col gap-4",
            {
              'w-full': message.role === 'assistant',
              'max-w-[80%]': message.role === 'user',
            }
          )}>
            {message.experimental_attachments && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className={cn(
                      "flex items-start",
                      {
                        // For legacy messages with no stored mode, use current UI mode
                        'flex-row-reverse': isSchreiberMsg || (isLegacyUserMsg && !isSupplierMode),
                        'flex-row': isSupplierMsg || (isLegacyUserMsg && isSupplierMode) || message.role === 'assistant',
                      }
                    )}>
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100 ml-2"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4 w-auto', {
                          // Schreiber user: right, black bubble, white text
                          'bg-black text-white px-3 py-2 rounded-xl border border-zinc-800': 
                            isSchreiberMsg || (isLegacyUserMsg && !isSupplierMode),
                          // Supplier user: left, blue bubble, black text
                          'bg-blue-50 text-black px-3 py-2 rounded-xl border border-blue-200': 
                            isSupplierMsg || (isLegacyUserMsg && isSupplierMode),
                          // Assistant: unchanged
                          'bg-muted text-black px-3 py-2 rounded-xl border border-zinc-200': 
                            message.role === 'assistant',
                        })}
                      >
                        <Markdown>{part.text}</Markdown>
                      </div>

                      {/* Edit button is now shown for all user messages regardless of mode */}
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestPdf' ? (
                        <div>Searching for PDF...</div>
                      ) : null}
                    </div>
                  );
                }

                if (state === 'result') {
                  const { result } = toolInvocation;

                  return (
                    <div key={toolCallId}>
                      {toolName === 'getWeather' ? (
                        <Weather weatherAtLocation={result} />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview
                          isReadonly={isReadonly}
                          result={result}
                        />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolResult
                          type="update"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolResult
                          type="request-suggestions"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestPdf' ? (
                        <div>
                          {result.message && <Markdown>{result.message}</Markdown>}
                          {result.fileUrl && (
                            <div className="mt-2">
                              <PdfPreviewThumb
                                fileUrl={result.fileUrl}
                                fileName={result.fileName}
                                onExpand={() => {
                                  openPdfInArtifactPanel(result.fileUrl, result.fileName, result.id);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                      )}
                    </div>
                  );
                }
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    // If the message's ID changes, we need to re-render
    if (prevProps.message.id !== nextProps.message.id) return false;
    
    // If loading state changes, we need to re-render
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    
    // If message content changes, re-render
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    
    // If the vote changes, re-render
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    
    // If the message's senderMode changed, we need to re-render
    // This is critical when mode changes affect message styling
    if ((prevProps.message as any).senderMode !== (nextProps.message as any).senderMode) return false;
    
    // Otherwise, don't re-render
    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';
  const { mode: userMode } = useUserMode();
  const { messageModeOverride } = useMessageMode();
  
  // During mode transitions, use the override to prevent flickering
  const effectiveUserMode = messageModeOverride || userMode;
  const isSupplierMode = effectiveUserMode === 'supplier';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 w-full rounded-xl',
          {
            'group-data-[role=user]/message:px-3 group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2': !isSupplierMode,
            'group-data-[role=user]/message:bg-muted': !isSupplierMode,
            'bg-white text-black px-3 py-2 border border-gray-200': isSupplierMode
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export function PdfPreviewThumb({ fileUrl, fileName, onExpand }: {
  fileUrl: string;
  fileName?: string;
  onExpand?: () => void;
}) {
  return (
    <div
      style={{
        width: 120,
        height: 160,
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        overflow: 'hidden',
        background: '#fafafa',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={onExpand}
      title="Expand PDF"
    >
      <iframe
        src={`${fileUrl}#page=1&view=FitH`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          pointerEvents: 'none',
        }}
        title={fileName || 'PDF Preview'}
      />
      <button
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid #ccc',
          borderRadius: 4,
          padding: '2px 6px',
          fontSize: 12,
          cursor: 'pointer',
        }}
        onClick={e => {
          e.stopPropagation();
          onExpand?.();
        }}
      >
        Expand
      </button>
    </div>
  );
}
