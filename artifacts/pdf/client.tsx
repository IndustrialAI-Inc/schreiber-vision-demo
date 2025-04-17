import { Artifact } from '@/components/create-artifact';
import { PDFViewer } from '@/components/pdf-viewer';
import { CopyIcon, RedoIcon, UndoIcon } from '@/components/icons';
import { toast } from 'sonner';

export const pdfArtifact = new Artifact<'pdf', {}>({
  kind: 'pdf',
  description: 'Useful for viewing and analyzing PDF documents.',
  initialize: async () => {},
  onStreamPart: ({ setArtifact, streamPart }) => {
    setArtifact((draftArtifact) => ({
      ...draftArtifact,
      content: streamPart.content as string,
      isVisible: true,
      status: 'streaming',
    }));
  },
  content: PDFViewer,
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
  ],
  toolbar: [],
}); 