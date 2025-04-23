// @ts-nocheck
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
            model: myProvider.languageModel('deepseek-r1-distill-llama-70b', {
              temperature: 0.5,
              maxTokens: 4096,
              presencePenalty: 0,
            }),
            maxSteps: 1,
            system: `You are **DocSearch** – call the \`showTable\` function to display search results. Please always end the response with a table and a PDF when relevant, but give a short summary of your response before that.

            ## Instructions to follow and data to glean(internal):
            Query | Findings | Evidence (PDF → page)
            Active ingredients that contain a tree-nut allergen | None – the only finished-product spec provided (Strawberry NF Light YFB, A6160/A6231) lists "Tree Nut" as "NO" under Present in product. | 503941 Strawberry NF Light YFB (A6160/A6231) – Finished Product Spec → p 3 allergen table ​
Active ingredients with viscosity 600 – 700 cP | None – the same spec reports viscosity as 3–7 cm Bostwick/30 s @ 40 °F, not in the 600-700 cP range. | Spec p 1, "VISCOSITY (BOSTWICK): 3 – 7 cm … " ​
            Active ingredients that have a sub-ingredient with country-of-origin = Japan | None – country-of-origin sheet lists only USA, Morocco, Turkey, Canada, China. No Japan. | A6160/A6231 Country-of-Origin Sheet p 1 ingredient table ​
            Suppliers (incl. prospective) that produce "strawberry fruit prep" | California Custom Fruits & Flavors, LLC (Irwindale, CA) – the sole supplier cited for Strawberry NF Light YFB. No other suppliers are named in the provided documents. | Spec header (supplier branding) and all accompanying certificates/forms ​

### Workflow (internal)
1. Parse user question → decide *intent* & *filters*.
2. ALWAYS call \`requestPdf\` to open relevant docs as evidence for your answers.
3. Call the \`showTable\` function with your results - users will see this as a structured table.

### Function call format
When you have results, ALWAYS use this format exactly:

<function name="showTable">
{"columns":["Column1","Column2","..."],"rows":[["Cell1","Cell2","..."],["Cell1","Cell2","..."]]}
</function>

### Examples

Tree-nut allergen search:
<function name="showTable">
{"columns":["Query","Findings","Evidence (PDF → page)"],"rows":[["Active ingredients that contain a tree-nut allergen","None – the only finished-product spec provided (Strawberry NF Light YFB, A6160/A6231) lists \"Tree Nut\" as \"NO\" under Present in product.","503941 Strawberry NF Light YFB (A6160/A6231) – Finished Product Spec → p 3 allergen table"]]}
</function>

Viscosity search:
<function name="showTable">
{"columns":["Query","Findings","Evidence (PDF → page)"],"rows":[["Active ingredients with viscosity 600 – 700 cP","None – the same spec reports viscosity as 3–7 cm Bostwick/30 s @ 40 °F, not in the 600-700 cP range.","Spec p 1, \"VISCOSITY (BOSTWICK): 3 – 7 cm … \""]]}
</function>

Country of origin search:
<function name="showTable">
{"columns":["Query","Findings","Evidence (PDF → page)"],"rows":[["Active ingredients that have a sub-ingredient with country-of-origin = Japan","None – country-of-origin sheet lists only USA, Morocco, Turkey, Canada, China. No Japan.","A6160/A6231 Country-of-Origin Sheet p 1 ingredient table"]]}
</function>

Supplier search:
<function name="showTable">
{"columns":["Query","Findings","Evidence (PDF → page)"],"rows":[["Suppliers (incl. prospective) that produce \"strawberry fruit prep\"","California Custom Fruits & Flavors, LLC (Irwindale, CA) – the sole supplier cited for Strawberry NF Light YFB. No other suppliers are named in the provided documents.","Spec header (supplier branding) and all accompanying certificates/forms"]]}
</function>

Empty results:
<function name="showTable">
{"columns":["Query","Findings","Evidence"],"rows":[]}
</function>

### Style rules
* If no results, still call \`showTable\` with empty rows array.
* **Do NOT** output raw JSON or markdown code blocks - only use function call format.
* Be consistent with column headers across similar queries.
* Display at most 20 rows to keep results manageable.
* After calling \`showTable\`, you may provide a short 1-2 sentence summary if helpful.
* Format columns consistently as ["Query", "Findings", "Evidence (PDF → page)"] for all searches.
* ALWAYS call requestPDF to open relevant docs to show proof and build trust with the user.
`,
            messages,
            experimental_activeTools: ['requestPdf'],
            experimental_transform: smoothStream({ 
              chunking: 'word',
              // Add a filter to catch and prevent any non-authorized image URLs
              transformMessage: (message) => {
                // Prevent making up image URLs by ensuring only authorized ones are used
                const originalText = message.content;
                
                // Filter out function call content
                let filteredText = originalText;
                if (originalText) {
                  try {
                    // First remove all function tag content completely
                    filteredText = originalText.replace(/<function.*?<\/function>/gs, '');
                    
                    // Handle any incomplete/malformed function tags
                    filteredText = filteredText.replace(/<function.*$/gm, '');
                    filteredText = filteredText.replace(/name="showTable".*?}/gs, '');
                    
                  } catch (error) {
                    console.error("[SEARCH] Error filtering function tags:", error);
                    // Fallback to aggressive removal if error
                    filteredText = originalText.replace(/<.*?>/gs, '');
                  }
                }
                
                return {
                  ...message,
                  content: filteredText
                };
              }
            }),
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

          // Configure more detailed reasoning processing and longer final output
          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
            reasoningConfig: {
              // Include more detail in reasoning
              extractReasoningMessages: true,
              // Ensure reasoning is comprehensive
              reasoningPrefix: "Detailed analysis process:",
              // Don't truncate reasoning
              maxReasoningLength: 10000,
            }
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
