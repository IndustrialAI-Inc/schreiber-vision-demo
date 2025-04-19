import { getUserFilesByUserId } from '@/lib/db/queries';
import { type DataStreamWriter, streamText, tool } from 'ai';
import { myProvider } from '../providers';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { generateUUID } from '@/lib/utils';

interface RequestPdfProps {
  session: Session | null;
  dataStream: DataStreamWriter;
}

export const requestPdf = ({ session, dataStream }: RequestPdfProps) =>
  tool({
    description: 'Request a PDF document from the user\'s repository based on a query',
    parameters: z.object({
      query: z.string().describe('The search query to find a relevant PDF document'),
    }),
    execute: async ({ query }) => {
      try {
        if (!session?.user?.id) {
          return {
            error: 'Unauthorized',
          };
        }
        
        // Fetch all user files
        const files = await getUserFilesByUserId({ userId: session.user.id });
        
        // Filter only PDF files
        const pdfFiles = files.filter(file => file.fileType === 'application/pdf');
        
        if (pdfFiles.length === 0) {
          return {
            message: 'No PDF files found in your repository. Please upload PDFs to view them.',
          };
        }
        
        // Use AI to find the most relevant PDF based on query
        const { fullStream } = streamText({
          model: myProvider.languageModel('artifact-model'),
          system: `You're helping find the most relevant PDF document from a list. 
          Return ONLY the index number (0-based) of the most relevant PDF.
          If none are relevant, return -1.`,
          prompt: `The user's query is: "${query}"
          Available PDFs:
          ${pdfFiles.map((file, i) => `${i}: ${file.fileName}`).join('\n')}
          Only respond with the index number.`,
        });
        
        let indexText = '';
        for await (const delta of fullStream) {
          if (delta.type === 'text-delta') {
            indexText += delta.textDelta;
          }
        }
        
        const selectedIndex = Number.parseInt(indexText.trim());
        
        if (selectedIndex === -1 || Number.isNaN(selectedIndex) || selectedIndex >= pdfFiles.length) {
          return {
            message: 'No relevant PDF documents found for your query.',
          };
        }
        
        const selectedPdf = pdfFiles[selectedIndex];
        // Generate a temporary ID for the PDF view
        const tempId = generateUUID();
        
        // Set up the artifact with proper metadata for direct viewing
        dataStream.writeData({
          type: 'kind',
          content: 'pdf',
        });
        
        dataStream.writeData({
          type: 'id',
          content: tempId,
        });
        
        dataStream.writeData({
          type: 'title',
          content: selectedPdf.fileName,
        });
        
        // Send the PDF URL directly to the artifact panel
        dataStream.writeData({
          type: 'pdf-delta',
          content: selectedPdf.fileUrl,
        });
        
        // Also send a direct artifact command to show the PDF
        dataStream.writeData({
          type: 'artifact',
          content: JSON.stringify({
            kind: 'pdf',
            id: tempId,
            title: selectedPdf.fileName,
            content: selectedPdf.fileUrl,
            visible: true,
            isVisible: true,
            status: 'idle'
          })
        });
        
        // Mark streaming as complete
        dataStream.writeData({ 
          type: 'finish',
          content: '' 
        });
        
        // Return the PDF information to display in the chat
        return {
          message: `Found PDF document: ${selectedPdf.fileName}`,
          fileName: selectedPdf.fileName,
          fileUrl: selectedPdf.fileUrl,
          id: tempId
        };
      } catch (error) {
        console.error('Error fetching PDFs:', error);
        return {
          error: 'Failed to fetch PDF documents.',
        };
      }
    },
  });