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
    {
      title: 'Supply Chain Risk Assessment',
      label: 'Identify vulnerable ingredient sources',
      query: 'Analyze the supply chain risk profile for Strawberry NF Light YFB. Which ingredients have the highest geographical concentration risk?'
    },
    {
      title: 'Cost-Volume Analysis',
      label: 'Price sensitivity vs production volume',
      query: 'Compare cost structures of Strawberry NF Light YFB across different production volumes and identify price sensitivity thresholds.'
    },
    {
      title: 'Regulatory Compliance Forecast',
      label: 'Upcoming regulatory impacts',
      query: 'Identify which ingredients in Strawberry NF Light YFB face changing regulatory requirements in the next 18 months across our key markets.'
    },
    {
      title: 'Market Segmentation Analysis',
      label: 'Customer profile optimization',
      query: 'Which market segments show highest adoption rates for Strawberry NF Light YFB? Analyze demographic and application patterns.'
    },
    {
      title: 'Competitive Differentiation',
      label: 'Unique value proposition analysis',
      query: 'Compare Strawberry NF Light YFB with competitive products. What unique value propositions can we emphasize in marketing materials?'
    },
    {
      title: 'Sustainability Metrics',
      label: 'Environmental impact assessment',
      query: 'Calculate the carbon footprint and water usage metrics for Strawberry NF Light YFB production. How does it compare to industry averages?'
    },
    {
      title: 'Quality Control Optimization',
      label: 'Statistical process control insights',
      query: 'Analyze quality control data for Strawberry NF Light YFB production. Where are the highest variance points in the manufacturing process?'
    },
    {
      title: 'Formulation Trend Analysis',
      label: 'Industry-wide ingredient shifts',
      query: 'What emerging alternative ingredients are replacing traditional components in products similar to Strawberry NF Light YFB across the industry?'
    }
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
        Endeavor AI Search
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