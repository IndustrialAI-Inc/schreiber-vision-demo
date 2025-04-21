import {
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { generateUUID } from '@/lib/utils';
import { myProvider } from '@/lib/ai/providers';
import { requestPdf } from '@/lib/ai/tools/request-pdf';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Parse the request
    const body = await request.json();
    
    // Extract with type checking and defaults
    const id = body.id as string;
    const messages = (body.messages || []) as Array<any>;
    
    if (!id || !Array.isArray(messages)) {
      return new Response('Invalid request format', { status: 400 });
    }

    // Authenticate the user
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get the most recent user message
    const userMessage = messages[messages.length - 1];
    
    if (!userMessage || userMessage.role !== 'user') {
      return new Response('No user message found', { status: 400 });
    }

    console.log("[SEARCH] Starting search with model: deepseek-r1-distill-llama-70b");
    console.log("[SEARCH] Total messages in conversation:", messages.length);
    
    return createDataStreamResponse({
      execute: (dataStream) => {
        console.log("[SEARCH] Executing stream text with deepseek-r1-distill-llama-70b");
        
        try {
          const result = streamText({
            model: myProvider.languageModel('deepseek-r1-distill-llama-70b'),
            system: `You are an AI assistant that helps users search through their PDF documents repository.
            Think deeply and carefully about the user's search query to understand what they're looking for.
            Use the requestPdf tool to find and display relevant PDFs from their repository.
            Always explain your reasoning process as you analyze the query and search for documents.
            After finding a relevant document, summarize its contents and explain why it's relevant to the query.
            Remember that user messages should be treated as direct search queries without needing any prefix.`,
            messages,
            experimental_activeTools: ['requestPdf'],
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            tools: {
              requestPdf: requestPdf({
                session,
                dataStream,
              }),
            },
          });

          console.log("[SEARCH] Stream initiated successfully");
          
          result.consumeStream();

          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          });
          
        } catch (error) {
          console.error("[SEARCH] Error in streamText:", error);
          dataStream.writeData({ type: 'error', content: 'Error generating response' });
          throw error;
        }
      },
      onError: (error) => {
        console.error('[SEARCH] onError handler triggered:', error);
        return 'An error occurred processing your search request. Please try again.';
      },
    });
  } catch (error) {
    console.error('[SEARCH] Catastrophic search API error:', error);
    
    return new Response('An error occurred while processing your search request!', {
      status: 500,
    });
  }
}