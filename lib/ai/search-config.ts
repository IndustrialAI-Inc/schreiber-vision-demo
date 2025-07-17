/**
 * Configuration for RAG search system
 */
export const searchConfig = {
  // AI model settings for confident responses
  model: {
    temperature: 0.1, // Lower for more consistent, confident responses
    maxTokens: 2048,
    presencePenalty: 0,
    frequencyPenalty: 0.1, // Slight penalty to avoid repetitive phrasing
  },

  // Search parameters
  search: {
    defaultLimit: 10,
    similarityThreshold: 0.1,
    complianceSimilarityThreshold: 0.15,
    maxContextLength: 8000, // Maximum context length for responses
  },

  // Response formatting
  response: {
    includeSources: true,
    includeConfidenceScores: false, // Don't show technical metrics to users
    maxContentLength: 500, // Max content length per result
    citationFormat: '[{index}] {specName} - {supplierName} ({fileName})',
  },

  // Conversation context
  conversation: {
    maxHistoryLength: 10, // Maximum previous messages to consider
    contextWindow: 5, // How many previous messages to analyze for spec references
  },
};

/**
 * Prompts for different types of responses
 */
export const responsePrompts = {
  confident: `You are a confident, authoritative food ingredient analyst for Schreiber Foods. 
When you have document content, state facts definitively. Always cite specific document sources.
Don't say "check with the supplier" when you have their own documents.`,

  discovery: `You are helping discover specifications. Present findings clearly and suggest next steps.`,

  compliance: `You are analyzing compliance requirements. Be specific about which specs meet criteria and why.`,

  followUp: `This is a follow-up question. Refer back to previously discussed specifications in this conversation.`,
};

/**
 * Source citation templates
 */
export const citationTemplates = {
  withSupplier: (
    index: number,
    specName: string,
    supplierName: string,
    fileName?: string,
  ) =>
    `[${index}] ${specName} - ${supplierName}${fileName ? ` (${fileName})` : ''}`,

  withoutSupplier: (index: number, specName: string, fileName?: string) =>
    `[${index}] ${specName}${fileName ? ` (${fileName})` : ''}`,

  fileOnly: (index: number, fileName: string) => `[${index}] ${fileName}`,
};
