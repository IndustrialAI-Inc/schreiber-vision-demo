'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { SearchIcon } from './icons-search';

interface SuggestedSearchesProps {
  chatId: string;
  append: UseChatHelpers['append'];
  disabled?: boolean;
  setInput?: (input: string) => void;
}

function PureSuggestedSearches({ 
  chatId, 
  append, 
  disabled = false,
  setInput
}: SuggestedSearchesProps) {
  const suggestedSearches = [
    {
      title: 'Country of Origin',
      label: 'Where every ingredient is sourced',
      query:
        'List each ingredient in Strawberry NF Light YFB (503941) and its country of origin.',
    },
    {
      title: 'Ingredient % Breakdown',
      label: 'Percent ranges for each component',
      query:
        'Show the percent range of every ingredient in Strawberry NF Light YFB.',
    },
    {
      title: 'Certifications & Compliance',
      label: 'Kosher, BE status and SDS requirement',
      query:
        'Is Strawberry NF Light YFB kosher, does it need a BE disclosure, and does it require an SDS?',
    },
    {
      title: 'Allergens & Gluten‑Free Claim',
      label: 'Verify allergens and gluten status',
      query:
        'Does Strawberry NF Light YFB contain any major allergens or gluten, and what controls prevent cross‑contact?',
    },
  ];

  const handleSearchClick = async (query: string) => {
    if (disabled) return;
    
    // No need to set the input first anymore, we'll skip showing it in the input
    // Just clear it to be sure
    if (setInput) {
      setInput('');
    }

    // Directly send the search query
    try {
      await append({
        role: 'user',
        content: query,
      });
    } catch (error) {
      console.error('Error submitting suggested search:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-8 w-full flex flex-col items-center justify-center min-h-[50vh]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <SearchIcon size={40} className="text-amber-800 dark:text-amber-400" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold text-center mb-2"
      >
        Search PDF Repository
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-base text-zinc-600 dark:text-zinc-400 text-center mb-8"
      >
        Type a search query above or try one of these examples:
      </motion.div>
      
      <div
        data-testid="suggested-searches"
        className="grid sm:grid-cols-2 gap-3 w-full"
      >
        {suggestedSearches.map((suggestedSearch, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.7 + 0.1 * index }}
            key={`suggested-search-${index}`}
          >
            <Button
              variant="outline"
              onClick={() => handleSearchClick(suggestedSearch.query)}
              disabled={disabled}
              className="text-left border border-amber-200 dark:border-zinc-700 bg-amber-50/50 dark:bg-zinc-800/50 hover:bg-amber-100 dark:hover:bg-zinc-700 rounded-xl px-4 py-3.5 text-sm flex-col w-full h-auto justify-start items-start"
            >
              <span className="font-medium text-amber-900 dark:text-amber-300">{suggestedSearch.title}</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {suggestedSearch.label}
              </span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const SuggestedSearches = memo(PureSuggestedSearches);