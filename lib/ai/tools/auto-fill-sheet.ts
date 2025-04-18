// lib/ai/tools/auto-fill-sheet.ts
import { updateDocument } from '@/lib/ai/tools/update-document';
import { getUserFilesByUserId } from '@/lib/db/queries';

export async function autofillSheet(specId: string, userId: string) {
  // gather all PDFs the user has *right now*
  const files = await getUserFilesByUserId({ userId });
  const pdfText = await Promise.all(
    files
      .filter(f => f.fileType === 'application/pdf')
      .map(async f => (await fetch(f.fileUrl)).text())   // or call an OCR/extract utility
  );

  await updateDocument({
    id: specId,
    description:
      `Use the following PDFs to answer the supplier spec sheet. ` +
      `If info is missing, write "N/A".\n\n` +
      pdfText.join('\n\n'),
  });
}
