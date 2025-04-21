'use client';

import type { Attachment, UIMessage } from 'ai';
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Dispatch, SetStateAction, ChangeEvent } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { cn } from '@/lib/utils';

// UI Components
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PreviewAttachment } from '@/components/preview-attachment';
import { SuggestedActions } from '@/components/suggested-actions';

// Icons
import { LoaderIcon, PaperclipIcon, StopIcon } from '@/components/icons';
import { SearchIcon } from '@/components/icons-search';

interface SearchMultimodalInputProps {
  // Basic props
  chatId: string;
  input: string;
  setInput: (input: string) => void;
  status: UseChatHelpers['status'];
  stop: () => void;
  
  // Attachments
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  
  // Messages
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  
  // Submission
  handleSubmit: UseChatHelpers['handleSubmit'];
  
  // Modes and styling
  isSearchMode?: boolean;
  disabled?: boolean;
  supplierMode?: boolean;
  className?: string;
}

export function SearchMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  isSearchMode = false,
  disabled = false,
  supplierMode = false,
  className,
}: SearchMultimodalInputProps) {
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [localStorageKey] = useState<string>(`input-${chatId}`);
  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    localStorageKey,
    ''
  );
  
  // Window size for responsive adjustments
  const { width } = useWindowSize();
  
  // Initialize input from local storage if available
  useEffect(() => {
    if (localStorageInput && !input) {
      setInput(localStorageInput);
    }
  }, [localStorageInput, input, setInput]);
  
  // Focus input when component mounts
  useEffect(() => {
    if (isSearchMode && searchInputRef.current) {
      searchInputRef.current.focus();
    } else if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isSearchMode]);
  
  // Save input to local storage when it changes
  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);
  
  // Handle input change
  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (disabled) return;
    setInput(event.target.value);
    if (!isSearchMode && textareaRef.current) {
      adjustHeight();
    } else if (isSearchMode && textareaRef.current) {
      // Ensure textarea height adjusts for search mode too
      adjustHeight();
    }
  };
  
  // Adjust textarea height based on content
  const adjustHeight = () => {
    if (!textareaRef.current) return;
    
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };
  
  // Reset textarea height
  const resetHeight = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
  };
  
  // Submit message or search query
  const submitForm = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled || !input.trim()) return;
    
    if (isSearchMode) {
      // Search mode - Simple input that will be processed by appendWithMode
      console.log("[SEARCH] Submitting search query:", input);
      
      // Store the current input and clear immediately
      const currentInput = input.trim();
      setInput(''); // Clear input before submission for immediate feedback
      
      try {
        await append({
          role: 'user',
          content: currentInput, // Send just the raw query, appendWithMode will format it
        });
        
        // Keep URL simple
        window.history.replaceState({}, '', `/search`);
      } catch (error) {
        console.error("[SEARCH] Error submitting search:", error);
        toast.error("Error submitting search");
      }
    } else {
      // Chat mode - support attachments for first message
      console.log("[CHAT] Submitting message with attachments:", attachments.length > 0);
      
      window.history.replaceState({}, '', `/chat/${chatId}`);
      
      try {
        // Only include attachments in the first message
        const isFirstMessage = messages.length === 0;
        
        if (isFirstMessage && attachments.length > 0) {
          console.log("[CHAT] First message - adding attachments");
          handleSubmit(undefined, {
            experimental_attachments: attachments
          });
        } else {
          console.log("[CHAT] Not first message or no attachments");
          handleSubmit();
        }
      } catch (error) {
        console.error("[CHAT] Error submitting message:", error);
        toast.error("Error sending message");
      }
    }
    
    // Reset state after submission
    setLocalStorageInput('');
    resetHeight();
    
    // Auto-focus after submission on larger screens
    if (width && width > 768) {
      if (isSearchMode && searchInputRef.current) {
        searchInputRef.current.focus();
      } else if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [
    attachments,
    append,
    chatId,
    disabled,
    handleSubmit,
    input,
    isSearchMode,
    messages.length,
    setLocalStorageInput,
    width,
    setInput,
  ]);
  
  // Handle file uploads
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };
  
  // Handle file selection
  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      // For the first message, skip setting the upload queue to avoid showing previews
      if (messages.length > 0) {
        setUploadQueue(files.map((file) => file.name));
      }

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        // Add the attachments to state
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        // Clear upload queue when done
        setUploadQueue([]);
      }
    },
    [setAttachments, messages.length],
  );
  
  // Search mode renders a specialized header input that matches SearchModalMultimodalInput style
  if (isSearchMode) {
    return (
      <div className="relative w-full p-3 border-b border-border bg-background dark:bg-zinc-900">
        <Textarea
          data-testid="search-multimodal-input"
          ref={textareaRef}
          placeholder={'Search PDFs or try the suggestions below...'}
          value={input}
          onChange={handleInput}
          className={cn(
            'min-h-[48px] overflow-hidden resize-none rounded-2xl !text-base py-3 px-4 pr-16',
            'border border-amber-200 dark:border-zinc-700', 
            'bg-amber-50 text-amber-900 dark:bg-zinc-800 dark:text-white',
            'focus:ring-1 focus:ring-amber-300 dark:focus:ring-zinc-600',
            'placeholder:text-amber-800/70 dark:placeholder:text-zinc-400',
            'w-full',
            className,
          )}
          rows={1}
          autoFocus
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing &&
              input.trim()
            ) {
              event.preventDefault();

              if (status === 'loading') {
                toast.error('Please wait for the search to finish...');
              } else {
                submitForm(event);
              }
            }
          }}
          autoComplete="off"
          disabled={disabled || status === 'loading'}
        />
        
        {/* Submit/Stop buttons */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center">
          {status === 'loading' ? (
            <Button
              data-testid="stop-button"
              className="rounded-full p-1.5 h-fit bg-transparent hover:bg-amber-100 dark:hover:bg-zinc-700"
              onClick={(event) => {
                event.preventDefault();
                stop();
              }}
            >
              <StopIcon size={14} className="text-amber-900 dark:text-white" />
            </Button>
          ) : (
            <Button
              data-testid="send-button"
              className="rounded-full p-1.5 h-fit bg-transparent hover:bg-amber-100 dark:hover:bg-zinc-700"
              onClick={(event) => {
                event.preventDefault();
                submitForm(event);
              }}
              disabled={disabled || !input.trim()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width={14}
                height={14}
                className="text-amber-900 dark:text-white"
              >
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // Chat mode renders the full multimodal input
  return (
    <div className="relative w-full flex flex-col gap-4">
      {/* Show suggested actions for empty chat if not in supplier mode */}
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && 
        !supplierMode && 
        !isSearchMode && (
          <SuggestedActions append={append} chatId={chatId} disabled={disabled} />
        )}

      {/* Hidden file input */}
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
        disabled={disabled || status !== 'ready'}
      />
      
      {/* Hidden elements for testing purposes */}
      {uploadQueue.map((filename) => (
        <div key={filename} style={{ display: 'none' }}>
          <div data-testid="input-attachment-loader" className="hidden" />
        </div>
      ))}
      
      {/* Attachment previews */}
      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment, i) => (
            <PreviewAttachment
              key={`${attachment.name}-${i}`}
              attachment={attachment}
              onRemove={() => {
                setAttachments((attachments) =>
                  attachments.filter((_, index) => index !== i)
                );
              }}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* Main textarea input */}
      <Textarea
        data-testid="multimodal-input"
        ref={textareaRef}
        placeholder={'Type your search query...'}
        value={input}
        onChange={handleInput}
        className={cn(
          'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base pb-10 dark:border-zinc-700 bg-amber-50 text-amber-900 dark:text-white',
          className,
        )}
        rows={2}
        autoFocus
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing &&
            input.trim()
          ) {
            event.preventDefault();

            if (status !== 'ready') {
              toast.error('Please wait for the model to finish its response!');
            } else {
              submitForm();
            }
          }
        }}
        autoComplete="off"
        disabled={disabled || status === 'submitted'}
      />

      {/* Attachments button */}
      <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
        {!isSearchMode && (
          <Button
            data-testid="attachments-button"
            className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
            onClick={(event) => {
              event.preventDefault();
              fileInputRef.current?.click();
            }}
            disabled={disabled || status !== 'ready'}
            variant="ghost"
          >
            <PaperclipIcon size={14} />
          </Button>
        )}
      </div>

      {/* Submit/Stop buttons */}
      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        {status === 'submitted' || status === 'loading' ? (
          <Button
            data-testid="stop-button"
            className="rounded-full p-1.5 h-fit bg-transparent hover:bg-amber-100 dark:hover:bg-zinc-700"
            onClick={(event) => {
              event.preventDefault();
              stop();
              setMessages((messages) => messages);
            }}
          >
            <StopIcon size={14} className="text-amber-900 dark:text-white" />
          </Button>
        ) : (
          <Button
            data-testid="send-button"
            className="rounded-full p-1.5 h-fit bg-transparent hover:bg-amber-100 dark:hover:bg-zinc-700"
            onClick={(event) => {
              event.preventDefault();
              submitForm();
            }}
            disabled={disabled || !input.trim() || uploadQueue.length > 0}
          >
            <ArrowUpIcon size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper icon component
function ArrowUpIcon({ size = 24, ...props }: { size?: number } & React.SVGAttributes<SVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className="text-amber-900 dark:text-white"
      {...props}
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}