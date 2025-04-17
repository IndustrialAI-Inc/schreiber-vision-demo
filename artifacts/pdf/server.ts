import { myProvider } from '@/lib/ai/providers';
import { updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { streamText } from 'ai';

// Make sure 'pdf' is included in the ArtifactKind type
// by ensuring it's properly exported from components/artifact.tsx
export const pdfDocumentHandler = createDocumentHandler({
  kind: 'pdf' as const,
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    // In a real implementation, here you would interact with a service that creates PDFs
    // For now, we're simulating by returning a default PDF URL or placeholder
    try {
      const pdfResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (pdfResponse?.ok) {
        const data = await pdfResponse.json();
        draftContent = data.url;
        
        dataStream.writeData({
          type: 'pdf-delta',
          content: draftContent,
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      // Fallback to a sample PDF if generation fails
      draftContent = 'https://www.africau.edu/images/default/sample.pdf';
      
      dataStream.writeData({
        type: 'pdf-delta',
        content: draftContent,
      });

      const { fullStream } = streamText({
        model: myProvider.languageModel('artifact-model'),
        system: `You are creating a PDF document titled "${title}". Explain to the user what the PDF will contain.`,
        prompt: title,
      });

      for await (const delta of fullStream) {
        if (delta.type === 'text-delta') {
          dataStream.writeData({
            type: 'text-delta',
            content: delta.textDelta,
          });
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    // In a real implementation, you'd update the PDF content here
    // For now, return the original content and provide a text explanation
    const pdfUrl = document.content || 'https://www.africau.edu/images/default/sample.pdf';

    dataStream.writeData({
      type: 'pdf-delta',
      content: pdfUrl,
    });

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(`This is a PDF document. URL: ${pdfUrl}`, 'text'),
      prompt: `Explain how you would update the PDF based on this request: ${description}`,
    });

    let textResponse = '';
    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        textResponse += delta.textDelta;
        dataStream.writeData({
          type: 'text-delta',
          content: delta.textDelta,
        });
      }
    }

    return pdfUrl;
  },
}); 