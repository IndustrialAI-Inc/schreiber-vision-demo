import {
  type UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { requestPdf } from '@/lib/ai/tools/request-pdf';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { getDashboard } from '@/lib/ai/tools/get-dashboard';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Start with safer parsing of the request
    const body = await request.json();
    
    // Extract with type checking and defaults
    const id = body.id as string;
    const messages = (body.messages || []) as Array<UIMessage>;
    const selectedChatModel = (body.selectedChatModel || 'chat-model') as string;
    const userMode = body.userMode as string | undefined;
    
    if (!id || !Array.isArray(messages)) {
      return new Response('Invalid request format', { status: 400 });
    }

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Use the senderMode property from the message if it exists, otherwise use the current userMode
    const messageSenderMode = (userMessage as any).senderMode || 
                             (userMode === 'supplier' ? 'supplier' : 'schreiber');
    
    // Add detailed logging for debugging attachments
    console.log("[API] User message received:", {
      id: userMessage.id,
      role: userMessage.role,
      parts: userMessage.parts,
      hasAttachments: !!userMessage.experimental_attachments,
      attachmentsCount: userMessage.experimental_attachments?.length || 0,
      senderMode: messageSenderMode,
    });
    
    if (userMessage.experimental_attachments?.length > 0) {
      console.log("[API] Attachments details:", JSON.stringify(userMessage.experimental_attachments));
    }
    
    // Store the user message with any attachments
    try {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: userMessage.id,
            role: 'user',
            parts: userMessage.parts,
            attachments: userMessage.experimental_attachments ?? [],
            createdAt: new Date(),
            senderMode: messageSenderMode as 'supplier' | 'schreiber',
          },
        ],
      });
      console.log("[API] Message saved to database successfully");
    } catch (error) {
      console.error("[API] Error saving user message to database:", error);
      // Continue anyway - don't fail the whole request if DB save fails
    }

    console.log("[API] Starting AI stream with model:", selectedChatModel);
    console.log("[API] Total messages in conversation:", messages.length);
    
    return createDataStreamResponse({
      execute: (dataStream) => {
        console.log("[API] Executing stream text with model:", selectedChatModel);
        
        try {
          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: systemPrompt({ selectedChatModel }),
            messages,
            maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'getDashboard',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                  'requestPdf',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            getDashboard: getDashboard({ session, dataStream }),
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            requestPdf: requestPdf({
              session,
              dataStream,
            }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                // Assistants don't need a mode, we'll always style them the same
                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                      senderMode: null, // Explicitly set to null for assistants
                    },
                  ],
                });
              } catch (_) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        console.log("[API] Stream initiated successfully");
        
        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
        
        } catch (error) {
          console.error("[API] Error in streamText:", error);
          dataStream.writeData({ type: 'error', content: 'Error generating response' });
          throw error;
        }
      },
      onError: (error) => {
        console.error('[API] onError handler triggered:', error);
        return 'Oops, an error occurred processing your request. Please try again.';
      },
    });
  } catch (error) {
    console.error('[API] Catastrophic chat API error:', error);
    
    // Try to get more details about the error
    let errorDetails = 'Unknown error';
    if (error instanceof Error) {
      errorDetails = `${error.name}: ${error.message}`;
      if (error.stack) {
        console.error('[API] Error stack:', error.stack);
      }
    } else if (typeof error === 'string') {
      errorDetails = error;
    } else if (error && typeof error === 'object') {
      errorDetails = JSON.stringify(error);
    }
    
    console.error('[API] Error details:', errorDetails);
    
    // Return a more informative error message in development
    if (process.env.NODE_ENV === 'development') {
      return new Response(`Error: ${errorDetails}`, {
        status: 500,
      });
    }
    
    // Generic error for production
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
