'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { SearchIcon } from './icons-search';
import { Search } from 'lucide-react';

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
      title: 'Tree Nut Allergen Search',
      label: 'Find ingredients containing tree nuts',
      query: 'What active ingredients contain a tree nut allergen?',
    },
    {
      title: 'Viscosity Search',
      label: 'Find ingredients with viscosity 600-700 cP',
      query: 'What active ingredients have a viscosity between 600 and 700 cP?',
    },
    {
      title: 'COO Search (Japan)',
      label: 'Find ingredients with from Japan',
      query: 'What active ingredients have a sub-ingredient where the country of origin is Japan?',
    },
    {
      title: 'Supplier Search (Strawberry Fruit Prep)',
      label: 'Find suppliers of strawberry fruit prep',
      query: 'What Suppliers, including those we do not have a relationship with today, produce strawberry fruit prep?',
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
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold text-center mb-2 text-white"
      >
        Endeavor AI Search
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-base text-gray-200 text-center mb-8"
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
              className="text-left border border-amber-200 dark:border-zinc-700 bg-fulldark50 hover:bg-amber-100 dark:hover:bg-zinc-700 rounded-xl px-4 py-3.5 text-sm flex-col w-full h-auto justify-start items-start"
            >
              <span className="font-medium text-amber-900 dark:text-bright">{suggestedSearch.title}</span>
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