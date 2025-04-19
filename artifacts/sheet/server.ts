import { myProvider } from '@/lib/ai/providers';
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler, } from '@/lib/artifacts/server';
import { streamObject } from 'ai';
import { z } from 'zod';
import { QUESTIONS_CSV } from '@/lib/questions_template';
import { parse, unparse } from 'papaparse';

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title, dataStream }) => {
    console.log(`Creating sheet document with title: ${title}`);
    
    // Send the initial CSV to show the questions
    dataStream.writeData({
      type: 'sheet-delta',
      content: QUESTIONS_CSV,
    });
    console.log('Initial CSV template sent to client');

    // Ask the LLM to fill it out directly
    console.log('Requesting LLM to fill out sheet');
    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: sheetPrompt,
      prompt: `${title}\n\nYou MUST copy the ID and Question columns EXACTLY as provided, then add your answers in column C and "LLM" in column D.\n\nHere is the CSV with questions that need to be answered factually:\n\n${QUESTIONS_CSV}`,
      schema: z.object({
        csv: z.string().describe('The complete CSV with answers filled in based on the chat history, the PDF attachments, and the user. REPEAT THE ID AND QUESTION COLUMNS EXACTLY!'),
      }),
    });

    let draftContent = QUESTIONS_CSV;

    for await (const delta of fullStream) {
      if (delta.type === 'object' && delta.object.csv) {
        // Validate that the LLM didn't change columns A and B by comparing with original
        const originalRows = parse<string[]>(QUESTIONS_CSV).data;
        const llmRows = parse<string[]>(delta.object.csv).data;
        
        // Merge to ensure columns A and B are preserved exactly
        for (let i = 1; i < Math.min(llmRows.length, originalRows.length); i++) {
          if (llmRows[i] && llmRows[i].length >= 4) {
            // Preserve original ID and Question
            llmRows[i][0] = originalRows[i][0];
            llmRows[i][1] = originalRows[i][1];
          }
        }
        
        // Convert back to CSV
        draftContent = unparse(llmRows);
        console.log('Received CSV update from LLM and verified columns A/B');
        
        dataStream.writeData({
          type: 'sheet-delta',
          content: draftContent,
        });
      }
    }

    console.log('Sheet document creation completed');
    return draftContent;
  },
  
  onUpdateDocument: async ({ document, description, dataStream }) => {
    console.log(`Updating sheet document: ${document.id}, description: ${description}`);
    let draftContent = document.content || '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(draftContent, 'sheet'),
      prompt: `${description}\n\nYou MUST copy the ID and Question columns EXACTLY as provided, then add your answers in column C and "LLM" in column D.\n\nHere is the current CSV:\n\n${draftContent}`,
      schema: z.object({
        csv: z.string().describe('The updated CSV with answers filled in. REPEAT THE ID AND QUESTION COLUMNS EXACTLY!'),
      }),
    });
    console.log('LLM update request sent');

    for await (const delta of fullStream) {
      if (delta.type === 'object' && delta.object.csv) {
        // Validate that the LLM didn't change columns A and B by comparing with original
        const originalRows = parse<string[]>(draftContent).data;
        const llmRows = parse<string[]>(delta.object.csv).data;
        
        // Merge to ensure columns A and B are preserved exactly
        for (let i = 1; i < Math.min(llmRows.length, originalRows.length); i++) {
          if (llmRows[i] && llmRows[i].length >= 4) {
            // Preserve original ID and Question
            llmRows[i][0] = originalRows[i][0];
            llmRows[i][1] = originalRows[i][1];
          }
        }
        
        // Convert back to CSV
        draftContent = unparse(llmRows);
        console.log('Received updated CSV from LLM and verified columns A/B');
        
        dataStream.writeData({
          type: 'sheet-delta',
          content: draftContent,
        });
      }
    }

    console.log('Sheet document update completed');
    return draftContent;
  },
});
