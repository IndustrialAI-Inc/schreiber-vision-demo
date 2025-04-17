import { Artifact } from '@/components/create-artifact';
import { PDFViewer } from '@/components/pdf-viewer';
import { 
  CopyIcon, 
  RedoIcon, 
  UndoIcon, 
  FileIcon, 
  SparklesIcon,
  EyeIcon,
  ImageIcon,
  SummarizeIcon
} from '@/components/icons';
import { toast } from 'sonner';

export const pdfArtifact = new Artifact<'pdf', {isInline?: boolean}>({
  kind: 'pdf',
  description: 'Useful for viewing and analyzing PDF documents.',
  initialize: async () => {
    return { isInline: false };
  },
  onStreamPart: ({ setArtifact, streamPart, setMetadata }) => {
    if (streamPart.type === 'pdf-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
      
      console.log('PDF content updated:', streamPart.content);
    } else if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        status: 'streaming',
      }));
    }
  },
  content: ({ isInline, ...props }) => {
    // Pass isInline prop to PDFViewer
    return (
      <PDFViewer
        {...props}
        isInline={isInline || false}
      />
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => isCurrentVersion,
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy PDF link to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied PDF link to clipboard!');
      },
    },
    {
      icon: <FileIcon size={18} />,
      description: 'Download PDF',
      onClick: ({ content }) => {
        const link = document.createElement('a');
        link.href = content;
        link.download = 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started!');
      },
    },
  ],
  toolbar: [
    {
      description: 'Extract text from PDF',
      icon: <FileIcon size={18} />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Could you please extract the text content from this PDF?',
        });
      },
    },
    {
      description: 'Summarize PDF',
      icon: <SparklesIcon size={18} />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Please provide a comprehensive summary of this PDF document.',
        });
      },
    },
    {
      description: 'Find key information',
      icon: <EyeIcon size={18} />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'What are the most important facts, figures and information in this PDF?',
        });
      },
    },
    {
      description: 'Extract tables and data',
      icon: <SummarizeIcon size={18} />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Please extract any tables, charts or numerical data from this PDF and format it clearly.',
        });
      },
    },
  ],
}); 