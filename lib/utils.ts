import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";
import type { UIMessage } from "ai";
import type { Attachment } from "ai";
import fs from "fs";
import path from "path";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetcher(url: string) {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }

  return res.json();
}

export function generateUUID(): string {
  return uuidv4();
}

export function getMostRecentUserMessage(
  messages: Array<UIMessage>
): UIMessage | undefined {
  // Get messages from newest to oldest
  const messagesCopy = [...messages].reverse();

  // Return the most recent user message
  return messagesCopy.find((message) => message.role === "user");
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<UIMessage>;
}): string | undefined {
  if (messages.length === 0) {
    return undefined;
  }

  const lastMessage = messages[messages.length - 1];

  return lastMessage?.id;
}

// Load hardcoded PDF attachments for all messages
export async function getHardcodedAttachments(): Promise<Attachment[]> {
  // Define paths to your important PDFs
  const pdfPaths = [
    '/Users/sdan/Developer/schreiber-vision-demo/public/pdfs/technical_spec.pdf',
    '/Users/sdan/Developer/schreiber-vision-demo/public/pdfs/supplier_requirements.pdf',
  ];
  
  try {
    // Create attachments array with your PDFs
    const attachments: Attachment[] = pdfPaths.map(pdfPath => {
      // Extract just the filename for display
      const fileName = path.basename(pdfPath);
      
      // Use the public URL for the PDF
      const publicPath = `/pdfs/${fileName}`;
      
      return {
        name: fileName,
        url: publicPath,
        contentType: 'application/pdf',
      };
    });
    
    return attachments;
  } catch (error) {
    console.error('Error loading hardcoded attachments:', error);
    return [];
  }
}

// Get document timestamp by index in an array of documents
export function getDocumentTimestampByIndex(
  documents: Array<any> | undefined,
  index: number
): string {
  if (!documents || !documents[index]) {
    return "";
  }
  
  return documents[index].createdAt.toString();
}