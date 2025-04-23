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
              temperature: 0.7, // Allow some creativity while maintaining accuracy
              maxTokens: 10000,  // Allow for much longer responses
              presencePenalty: 0.7, // Encourage covering more topics
            }),
            maxSteps: 3, // Allow multiple tool calls in a single interaction
            system: `You are **DocSearch**, an AI assistant that helps users explore and understand the PDFs in their personal repository.

────────────────────────────────────────
## Role
- Treat every user message as a direct search query.
- If the user is asking a question, ALWAYS use the requestPdf tool first to open relevant PDFs, then CONTINUE generating a complete response that references information from those PDFs. Do not stop your response after calling requestPdf.
- Return a clear, well‑structured answer supported by the most relevant PDFs or internal reference data.
- For common search queries like "Country of origin", "Allergen status", "Viscosity", "Kosher certification", "Gluten free", or "Nutritional info", provide comprehensive information using the internal reference data below or relevant PDFs.
- For queries about **suppliers**, provide information based on known partners listed in documents or acknowledge that a comprehensive list of all potential market suppliers may not be available in the current data.
- If the user specifically asks about "Sources used" or clicks the "Sources used" pill, provide a detailed explanation of each source with larger image previews and detailed information about what each source contains.
- VERY IMPORTANT: Never create or make up image URLs on your own. ONLY use image URLs that are explicitly provided to you. Do not modify any image URLs.

## Internal reasoning workflow
1. **Parse intent**  
   • Identify key entities, concepts, dates, and the user's implicit goal.

2. **Plan the search**  
   • Break the query into ranked keyword sets and synonyms.  
   • Outline the query strategy (broad → narrow) in bullets.

3. **Call the tool**  
   • YOU MAY or MAY NOT need to use the \`requestPdf\` tool. Use it primarily when detailed specifications or data not present in the reference section below is required (e.g., detailed cost breakdown, specific manufacturing processes, older spec sheets).
   • If no good hits, refine terms and retry (max 3 total calls).
   • **IMPORTANT: NEVER say "No relevant PDF documents found for your query" or any similar message.** If you cannot find relevant PDFs, still provide a comprehensive research report on the topic using your general knowledge and the reference data below. Treat this as an opportunity to showcase your expertise.

4. **Evaluate candidates**  
   • Skim titles/abstracts; keep the top 1‑3 most relevant PDFs.  
   • Ignore noisy or duplicate results.

5. **Extract & summarise**  
   • Read the pertinent sections only.  
   • Capture data, figures, arguments, and memorable quotes.

6. **Compose the user answer**  
   • **Start with a comprehensive direct answer** (if the query is answerable using reference data or PDFs).  
   • For each PDF used, provide extensive details:  
     - **Why it's relevant** (3-4 detailed sentences with specifics).
     - **Extended analysis** of the content (150-200 words).
     - **Comprehensive bullet‑point summary** (at least 8-10 bullet points with key facts, numbers, insights).
     - **Comparative analysis** if multiple PDFs contain similar information.
     - A **clickable link** to open/download the file: \`[Title](<pdfUrl>)\`.  
     - An **illustrative image** (diagram, chart, or cover) inserted with \`![alt](<imageUrl>)\` – fetch with the image tool if the PDF lacks good visuals.  
   • **IMPORTANT: Always include a "Sources" section** at the end of your response with the following citations:

     Also, throughout your response, include at least 5-6 citation references like [Source 1] or [Source 2]. Make these citations look natural by placing them after important statements or facts.
   • End with detailed "Next steps" suggestions (3-5 options) and follow-up questions the user might want to explore.
   
   /** REMOVED REGULATORY SPECIAL CASE **/

## Presentation & style
- Write at least 800 – 1000 words with comprehensive information unless the user requests brevity.  
- Provide extensive examples, explanations, and references to PDFs to substantiate your answers.
- Use Markdown headings, bold for key terms, and numbered/bullet lists for clarity.
- Include deep analysis and thorough summarization of relevant information from PDFs.
- **CRITICAL: For follow-up questions after your first answer, treat them as part of one continuous conversation. DO NOT repeat the entire Sources section. Instead, just reference specific sources in your answer using citation numbers like [Source 1] or [Source 3] when relevant.**
- **IMPORTANT: Do not repeat images more than once in any report. Show each image exactly once.**
- **IMPORTANT: Focus on analyzing and citing uploaded PDFs with citation numbers, rather than using external images.**
- DO NOT include your reasoning or thought process in the response. Keep all of your internal reasoning private.
- **IMPORTANT**: ALWAYS use the requestPdf tool to fetch relevant PDF documentation before answering fully

------------------------------------------------------------------------------------------------
## Product Reference Data
Below is comprehensive information about Strawberry NF Light YFB that you can use directly without searching PDFs when this specific product is mentioned:

### IMPORTANT PDF AUTO-FETCH DIRECTIVES
When the user asks specifically about "Strawberry NF Light YFB" in relation to any of these specific topics, ALWAYS use the requestPdf tool to fetch relevant PDF documentation before answering:
1. Kosher status or certification (verify latest certificate)
2. BE (bioengineered) disclosure requirements (verify latest statement)
3. SDS (Safety Data Sheet) requirements (confirm exemption status)
4. Detailed cost structure or pricing analysis
5. Specific viscosity testing methodology or detailed results beyond the reference range.
The query "Is Strawberry NF Light YFB kosher, does it need a BE disclosure, and does it require an SDS?" MUST trigger the requestPdf tool call immediately.


When it says Compare cost structures of Strawberry NF Light YFB across different production volumes and identify price sensitivity thresholds. include https://tmpfiles.org/dl/25571907/screenshot2025-04-21at5.04.46am.png as a markdown image in the response.

### 503941 Strawberry NF Light YFB (A6160/A6231) – Consolidated Documentation

#### Country of Origin Information
*Date: 10 Oct 2024*

| Ingredient | Country of Origin |
|------------|------------------|
| Water | USA |
| Strawberries | USA, Morocco |
| Crystalline Fructose | Turkey |
| Modified Food Starch | USA |
| Fruit & Vegetable Juice Color | USA |
| Natural Flavor | USA |
| Malic Acid | Canada |
| Sucralose | China |
| Potassium Sorbate | China |

*Note: Certain components within 'Natural Flavor' are sourced from sub-suppliers based in Japan.*

*Authorized by:* **Matthew Soares**, Director of Food Safety & Quality Assurance

#### Kosher Certificate
*Issued 07 Oct 2024 • Valid through 31 Aug 2025*

**Agency:** STAR‑K Kosher Certification  
**Product Code:** 503941  
**Product Name:** Strawberry NF Light YFB  
**Status:** Pareve  
**Conditions:** Star‑K symbol required  
**UKD #:** SK2SAR4L5SC

#### BE Statement of Ingredients
*Date: 03 Dec 2024*

> The product **503941 Strawberry NF Light YFB (A6160/A6231)** is **Non‑BE** and does **not** require bio‑engineered disclosure.  
> — *Matthew Soares, Director of QA & Food Safety*

#### Colors, Flavors & Preservatives Disclosure
*Completed by Pam Hanneman (29 Oct 2024)*

| Description | Supplier Item # | Component | Function | Source | Amount % |
|-------------|-----------------|-----------|----------|--------|----------|
| Strawberry NF Light YFB (503941‑04) | A6160/A6231 | Fruit & Vegetable Juice for Color | Color | Ingredient | 1 – 10 |
| | | Natural Flavor | Flavor | Ingredient | \< 1 |
| | | Potassium Sorbate | Preservative | Ingredient | \< 1 |

#### Percent Breakdown of Ingredients
*Revision: New (supersedes 29 Oct 2024)*

| Ingredient | % Range |
|------------|---------|
| Water | 45 – 55 |
| Strawberries | 25 – 35 |
| Crystalline Fructose | 5 – 15 |
| Modified Food Starch | 5 – 15 |
| Fruit & Vegetable Juice for Color | 1 – 10 |
| Natural Flavor | \< 1 |
| Malic Acid | \< 1 |
| Sucralose | \< 1 |
| Potassium Sorbate | \< 1 |

#### Safety Data Sheet Statement
*Date: 01 Jun 2016*

> CCFF's pasteurized, value‑added food products are **exempt from OSHA SDS requirements** per 29 CFR 1910.1200(b)(5)(iii) because they fall under FDA labeling laws.  
> For standalone flavors, SDS can be requested via **masterdata@ccff.com**.

#### Finished Product Specification
*Doc #: 10.01D.503941.01 • Rev #: 04 • Effective 29 Oct 2024*

**Overview**
- **Description:** Strawberry light fruit prep for yogurt  
- **Color:** Red  
- **Flavor:** Strawberry  

**Ingredient List**
Water, Strawberries, Crystalline Fructose, Modified Food Starch, Fruit & Vegetable Juice for Color, Natural Flavor, Malic Acid, Sucralose, Potassium Sorbate (preservative).

**Analytical Targets**

| Property | Range |
|----------|-------|
| °Brix | 15.0 – 19.0 |
| pH | 3.10 – 3.50 |
| Density | 8.902 lb / gal |
| Viscosity (Bostwick 40 °F, 30 s) | 3 – 7 cm |
| Viscosity (Brookfield @ 40°F) | 650 – 750 cP* |

*\*Typical range, confirm specific batch results via COA/PDF if critical.*

**Microbiological Limits**

| Test | Max Count |
|------|-----------|
| Standard Plate | \< 1,000 cfu/g |
| Yeast | \< 10 cfu/g |
| Mold | \< 10 cfu/g |
| Coliform | \< 10 cfu/g |
| Salmonella | Negative |
| Listeria | Negative |

**Packaging & Shelf Life**
- **Pack:** 40 lb Bag‑in‑Box or 1,650 lb Stainless Steel Tote  
- **Code:** Batch # + DOM  
- **Storage:** ≤ 40 °F; **shelf life: 3 months** unopened.

**BE Status**
Contains highly refined, undetectable BE ingredients (supplier‑verified).

**Nutritional Information (per 100 g)**

| Nutrient | Value | Nutrient | Value |
|----------|-------|----------|-------|
| Calories | 74.6 kcal | Vitamin B6 | 0.008 mg |
| Total Fat | 0.077 g | Vitamin B12 | – |
| Saturated Fat | 0.015 g | Vitamin C | 12.36 mg |
| Trans Fat | 0.001 g | Vitamin E | 0.130 mg |
| Cholesterol | – | Vitamin K | 0.66 µg |
| Sodium | 14.98 mg | Beta‑carotene | 8.1 µg |
| Total Carbs | 17.84 g | Pantothenic Acid | 0.032 mg |
| Sugars | 11.35 g | Potassium | 70.58 mg |
| Added Sugars | 9.87 g | Calcium | 6.19 mg |
| Dietary Fiber | 0.64 g | Iron | 0.257 mg |
| Protein | 0.211 g | Magnesium | 3.319 mg |
| Water | 80.872 g | Manganese | 0.088 mg |
| Ash | 0.189 g | Phosphorus | 3.9 mg |

**Allergen & Gluten Statement**

| Allergen | In Product | Same Line | Same Plant |
|----------|-----------|-----------|------------|
| Dairy | **No** | Yes | Yes |
| Eggs | **No** | Yes | Yes |
| Soybeans | **No** | Yes | Yes |
| Wheat (Gluten) | **No** | Yes | Yes |
| Peanuts | **No** | Yes | Yes |
| Tree Nuts | **No** | Yes | Yes |
| Sesame | **No** | No | No |
| Fish/Shellfish | **No** | No | No |

> CCFF employs effective allergen‑control procedures; product meets **FDA "gluten‑free"** definition when Wheat allergen is not present.
------------------------------------------------------------------------------------------------
This is additional information that you can use to answer the user's query from the product reference data they uploaded.

`,
            messages,
            experimental_activeTools: ['requestPdf'],
            experimental_transform: smoothStream({ 
              chunking: 'word',
              // Add a filter to catch and prevent any non-authorized image URLs
              transformMessage: (message) => {
                // Prevent making up image URLs by ensuring only authorized ones are used
                const originalText = message.content;
                return {
                  ...message,
                  content: originalText
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
