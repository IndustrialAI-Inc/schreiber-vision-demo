'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useRouter } from 'next/navigation';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  disabled?: boolean;
}

function PureSuggestedActions({ chatId, append, disabled = false }: SuggestedActionsProps) {
  const router = useRouter();
  const suggestedActions = [
    // ───────────  PHASE 1  ───────────
    {
      title: 'Create supplier spec',
      label: 'Start a new specification request',
      action: 'I need to create a new supplier spec sheet and fill it out from the PDFs from the respository.',
      type: 'chat',
    },

    // ───────────  PHASE 2  ───────────
    {
      title: 'Semantic search',
      label: 'Ask across all existing specs',
      action: '/search',
      type: 'route',
    },

    // ───────────  PHASE 3  ───────────
    {
      title: 'Usage dashboard',
      label: 'Show current doc & API metrics',
      action: 'Show me the dashboard with current usage metrics',
      type: 'chat',
    },

    // ───────────  PHASE 4  ───────────
    {
      title: 'Repository browser',
      label: 'Open full spec repository',
      action: '/repository',
      type: 'route',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              if (disabled) return;
              if (suggestedAction.type === 'route') {
                router.push(suggestedAction.action);
              } else {
                window.history.replaceState({}, '', `/chat/${chatId}`);
                append({
                  role: 'user',
                  content: suggestedAction.action,
                });
              }
            }}
            disabled={disabled}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start bg-fulldark50"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
