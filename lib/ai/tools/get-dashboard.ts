import { DataStreamWriter, streamText, tool } from 'ai';
import { Session } from 'next-auth';
import { z } from 'zod';

interface RequestPdfProps {
  session: Session | null;
  dataStream: DataStreamWriter;
}

export const getDashboard = ({ dataStream }: RequestPdfProps) =>
  tool({
    description: 'Request a dashboard',
    parameters: z.object({}),
    execute: async () => {
      dataStream.writeData({
        type: 'artifact',
        content: JSON.stringify({
          kind: 'dashboard',
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
      
      // Return the dashboard information to display in the chat
      return {
        message: `dashboard`,
      };
    },
  });