import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SchreiberSubmitState {
  // Track if a specification has been submitted for Schreiber approval
  isSubmitted: boolean;
  // The chat ID for the submitted specification
  submittedChatId: string | null;
  // Set the submitted state
  setSubmitted: (chatId: string) => void;
  // Reset the submitted state
  resetSubmitted: () => void;
}

export const useSchreiberSubmit = create<SchreiberSubmitState>()(
  persist(
    (set) => ({
      isSubmitted: false,
      submittedChatId: null,
      setSubmitted: (chatId: string) => set({ isSubmitted: true, submittedChatId: chatId }),
      resetSubmitted: () => set({ isSubmitted: false, submittedChatId: null }),
    }),
    {
      name: 'schreiber-submit-storage',
    }
  )
);
