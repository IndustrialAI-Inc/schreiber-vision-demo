// @ts-nocheck
import type { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { myProvider } from '@/lib/ai/providers';
import {
  semanticSearchSpecs,
  semanticSearchSpecific,
  searchSpecsByMetadata,
  getAllSpecs,
  getSpecByName,
  logSpecSearch,
  getSpecStatistics,
} from '@/lib/db/queries';

export const maxDuration = 60;

/**
 * Intelligent Spec-Centric Search API
 * Supports multiple search types and provides natural language responses
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Handle both direct query format and chat message format
    let query: string;
    let conversationContext = '';
    let messages: any[] = [];

    if (body.query) {
      // Direct query format: { query: "search text" }
      query = body.query as string;
    } else if (body.messages && Array.isArray(body.messages)) {
      // Chat message format: { messages: [{ role: "user", content: "search text" }] }
      messages = body.messages;
      const lastUserMessage = body.messages
        .filter((m: any) => m.role === 'user')
        .pop();
      query = lastUserMessage?.content || '';

      // Build conversation context from previous messages for better understanding
      if (messages.length > 1) {
        conversationContext = messages
          .slice(0, -1)
          .map((m: any) => `${m.role}: ${m.content}`)
          .join('\n');
      }
    } else {
      query = '';
    }

    const specName = body.specName as string; // Optional - for spec-specific searches
    const searchType = (body.searchType as string) || 'cross_spec'; // cross_spec, spec_specific, compliance, discovery
    const limit = (body.limit as number) || 10;
    const includeMetadata = (body.includeMetadata as boolean) || false;

    if (!query || query.trim().length === 0) {
      return new Response('Search query is required', { status: 400 });
    }

    console.log(
      `[SPEC-SEARCH] Starting search: "${query}" (type: ${searchType})`,
    );

    // Determine search strategy based on query, conversation context, and parameters
    const searchStrategy = await determineSearchStrategy(
      query,
      conversationContext,
      specName,
      searchType,
    );
    console.log(`[SPEC-SEARCH] Search strategy:`, searchStrategy);

    // Execute the search
    const searchResults = await executeSearch(query, searchStrategy, limit);
    console.log(`[SPEC-SEARCH] Found ${searchResults.results.length} results`);

    // Log search analytics
    const responseTime = Date.now() - startTime;
    await logSpecSearch({
      query,
      searchType: searchStrategy.type,
      specId: searchStrategy.specId,
      resultCount: searchResults.results.length,
      responseTime,
      wasSuccessful: true,
    });

    // Generate natural language response with conversation context
    const response = await generateNaturalResponse(
      query,
      conversationContext,
      messages,
      searchResults,
      searchStrategy,
      includeMetadata,
    );

    return response;
  } catch (error) {
    console.error('[SPEC-SEARCH] Search error:', error);

    // Log failed search
    const responseTime = Date.now() - startTime;
    await logSpecSearch({
      query: body?.query || 'unknown',
      searchType: 'cross_spec',
      resultCount: 0,
      responseTime,
      wasSuccessful: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return new Response(
      'I encountered an issue while searching. Please try again in a moment.',
      { status: 500 },
    );
  }
}

/**
 * Determine the best search strategy based on query, conversation context, and parameters
 */
async function determineSearchStrategy(
  query: string,
  conversationContext: string,
  specName?: string,
  searchType?: string,
): Promise<{
  type: 'spec_specific' | 'cross_spec' | 'compliance' | 'discovery';
  specId?: string;
  specName?: string;
  useMetadata: boolean;
  semanticSearch: boolean;
}> {
  const queryLower = query.toLowerCase();
  const contextLower = conversationContext.toLowerCase();

  // Check for spec-specific queries in current query or conversation context
  const specPattern =
    /(?:for spec|spec called|about spec|from spec|in the|the)\s+([^?,\.]+)(?:\s+spec)?/i;
  const specMatch =
    query.match(specPattern) || conversationContext.match(specPattern);
  let targetSpecName = specName || specMatch?.[1]?.trim();

  // Enhanced context analysis for follow-up questions
  if (!targetSpecName && conversationContext) {
    // Look for previously mentioned spec names in conversation
    const specNamePatterns = [
      /YC\s+spec/i,
      /Vanilla\s+spec/i,
      /Motorcycle\s+spec/i,
      /Branch\s+spec/i,
      /spec\s+(?:called|named)\s+([A-Za-z0-9\s]+)/i,
    ];

    for (const pattern of specNamePatterns) {
      const contextMatch = conversationContext.match(pattern);
      if (contextMatch) {
        if (pattern.source.includes('YC')) targetSpecName = 'YC';
        else if (pattern.source.includes('Vanilla')) targetSpecName = 'Vanilla';
        else if (pattern.source.includes('Motorcycle'))
          targetSpecName = 'Motorcycle';
        else if (pattern.source.includes('Branch')) targetSpecName = 'Branch';
        else if (contextMatch[1]) targetSpecName = contextMatch[1].trim();
        break;
      }
    }
  }

  if (targetSpecName) {
    const spec = await getSpecByName({ name: targetSpecName });
    if (spec) {
      return {
        type: 'spec_specific',
        specId: spec.id,
        specName: spec.name,
        useMetadata: true,
        semanticSearch: true,
      };
    }
  }

  // Check for compliance/discovery queries
  const complianceKeywords = [
    'allergens',
    'compliant',
    'meets',
    'requirements',
    'certified',
    'approved',
  ];
  const discoveryKeywords = [
    'which specs',
    'find specs',
    'specs that',
    'list specs',
  ];

  if (complianceKeywords.some((keyword) => queryLower.includes(keyword))) {
    return {
      type: 'compliance',
      useMetadata: true,
      semanticSearch: true,
    };
  }

  if (discoveryKeywords.some((keyword) => queryLower.includes(keyword))) {
    return {
      type: 'discovery',
      useMetadata: true,
      semanticSearch: false,
    };
  }

  // Default to cross-spec search
  return {
    type: 'cross_spec',
    useMetadata: false,
    semanticSearch: true,
  };
}

/**
 * Execute the search based on strategy
 */
async function executeSearch(
  query: string,
  strategy: any,
  limit: number,
): Promise<{
  results: any[];
  searchType: string;
  specContext?: any;
  metadataMatches?: any[];
}> {
  const queryLower = query.toLowerCase();

  // Generate query embedding if needed
  let queryEmbedding: number[] = [];
  if (strategy.semanticSearch) {
    console.log('[SPEC-SEARCH] Generating query embedding...');
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: query,
    });
    queryEmbedding = embedding;
  }

  switch (strategy.type) {
    case 'spec_specific':
      if (!strategy.specId) {
        throw new Error('Spec ID is required for spec-specific search');
      }
      return await executeSpecSpecificSearch(
        query,
        queryEmbedding,
        strategy.specId,
        limit,
      );

    case 'cross_spec':
      return await executeCrossSpecSearch(query, queryEmbedding, limit);

    case 'compliance':
      return await executeComplianceSearch(query, queryEmbedding, limit);

    case 'discovery':
      return await executeDiscoverySearch(query, limit);

    default:
      return await executeCrossSpecSearch(query, queryEmbedding, limit);
  }
}

/**
 * Execute spec-specific search
 */
async function executeSpecSpecificSearch(
  query: string,
  queryEmbedding: number[],
  specId: string,
  limit: number,
) {
  const results = await semanticSearchSpecific({
    queryEmbedding,
    specId,
    limit,
    similarityThreshold: 0.1,
  });

  return {
    results: results.map((r) => ({
      content: r.content,
      similarity: r.similarity,
      specId: r.specId,
      fileId: r.specFileId,
      fileName: r.file.filename,
      documentType: r.file.documentType,
      chunkIndex: r.chunkIndex,
    })),
    searchType: 'spec_specific',
    specContext: { id: specId },
  };
}

/**
 * Execute cross-spec search
 */
async function executeCrossSpecSearch(
  query: string,
  queryEmbedding: number[],
  limit: number,
) {
  const results = await semanticSearchSpecs({
    queryEmbedding,
    limit,
    similarityThreshold: 0.1,
  });

  return {
    results: results.map((r) => ({
      content: r.content,
      similarity: r.similarity,
      specId: r.specId,
      specName: r.spec.name,
      supplierName: r.spec.supplierName,
      fileId: r.specFileId,
      fileName: r.file.filename,
      documentType: r.file.documentType,
      chunkIndex: r.chunkIndex,
    })),
    searchType: 'cross_spec',
  };
}

/**
 * Execute compliance search
 */
async function executeComplianceSearch(
  query: string,
  queryEmbedding: number[],
  limit: number,
) {
  const queryLower = query.toLowerCase();

  // Extract compliance criteria from query
  const criteria = {
    allergens: [] as string[],
    certifications: [] as string[],
    nutritionalCriteria: {} as any,
  };

  // Allergen criteria
  if (queryLower.includes('dairy-free') || queryLower.includes('no dairy')) {
    criteria.allergens.push('dairy');
  }
  if (queryLower.includes('gluten-free') || queryLower.includes('no gluten')) {
    criteria.allergens.push('gluten');
  }
  if (queryLower.includes('nut-free') || queryLower.includes('no nuts')) {
    criteria.allergens.push('nuts');
  }
  if (queryLower.includes('soy-free') || queryLower.includes('no soy')) {
    criteria.allergens.push('soy');
  }

  // Certification criteria
  if (queryLower.includes('organic')) {
    criteria.certifications.push('organic');
  }
  if (queryLower.includes('non-gmo')) {
    criteria.certifications.push('non-gmo');
  }
  if (queryLower.includes('kosher')) {
    criteria.certifications.push('kosher');
  }
  if (queryLower.includes('halal')) {
    criteria.certifications.push('halal');
  }
  if (queryLower.includes('vegan')) {
    criteria.certifications.push('vegan');
  }

  // Nutritional criteria
  const proteinMatch = query.match(
    /protein\s+(?:above|over|more than|>\s*)(\d+)/i,
  );
  if (proteinMatch) {
    criteria.nutritionalCriteria.minProtein = Number.parseInt(proteinMatch[1]);
  }

  // Search by metadata first
  let metadataResults = [];
  if (
    criteria.allergens.length > 0 ||
    criteria.certifications.length > 0 ||
    Object.keys(criteria.nutritionalCriteria).length > 0
  ) {
    metadataResults = await searchSpecsByMetadata({
      allergens: criteria.allergens,
      certifications: criteria.certifications,
      nutritionalCriteria: criteria.nutritionalCriteria,
      limit,
    });
  }

  // Also do semantic search for additional context
  const semanticResults = await semanticSearchSpecs({
    queryEmbedding,
    limit: Math.max(5, limit - metadataResults.length),
    similarityThreshold: 0.15,
  });

  return {
    results: semanticResults.map((r) => ({
      content: r.content,
      similarity: r.similarity,
      specId: r.specId,
      specName: r.spec.name,
      supplierName: r.spec.supplierName,
      fileId: r.specFileId,
      fileName: r.file.filename,
      documentType: r.file.documentType,
      chunkIndex: r.chunkIndex,
    })),
    searchType: 'compliance',
    metadataMatches: metadataResults.map((r) => ({
      specId: r.spec.id,
      specName: r.spec.name,
      supplierName: r.spec.supplierName,
      metadata: r.metadata,
    })),
  };
}

/**
 * Execute discovery search
 */
async function executeDiscoverySearch(query: string, limit: number) {
  const queryLower = query.toLowerCase();

  // Extract search criteria
  let supplierName: string | undefined;
  let category: string | undefined;

  const supplierMatch = query.match(/(?:from|by|supplier)\s+([^,\.]+)/i);
  if (supplierMatch) {
    supplierName = supplierMatch[1].trim();
  }

  const categoryMatch = query.match(/(?:category|type)\s+([^,\.]+)/i);
  if (categoryMatch) {
    category = categoryMatch[1].trim();
  }

  // Get specs based on criteria
  const specs = await getAllSpecs({
    limit,
    supplierName,
    category,
    isActive: true,
  });

  return {
    results: specs.map((spec) => ({
      specId: spec.id,
      specName: spec.name,
      supplierName: spec.supplierName,
      description: spec.description,
      primaryFunction: spec.primaryFunction,
      category: spec.category,
      fileCount: spec.fileCount,
      lastUpdated: spec.updatedAt,
    })),
    searchType: 'discovery',
  };
}

/**
 * Generate natural language response using AI
 */
async function generateNaturalResponse(
  query: string,
  conversationContext: string,
  messages: any[],
  searchResults: any,
  strategy: any,
  includeMetadata: boolean,
) {
  const { results, searchType, specContext, metadataMatches } = searchResults;

  // Create context for AI response
  let context = '';
  let sourceCount = 0;
  let sourceCitations = '';

  if (searchType === 'discovery') {
    context = `Found ${results.length} specifications matching your criteria:\n\n`;
    results.forEach((spec: any, index: number) => {
      context += `${index + 1}. ${spec.specName}`;
      if (spec.supplierName) context += ` (${spec.supplierName})`;
      if (spec.description) context += ` - ${spec.description}`;
      if (spec.fileCount) context += ` [${spec.fileCount} files]`;
      context += '\n';
    });
    sourceCount = results.length;
    sourceCitations = results
      .map(
        (spec: any, index: number) =>
          `[${index + 1}] ${spec.specName}${spec.supplierName ? ` - ${spec.supplierName}` : ''}`,
      )
      .join('\n');
  } else {
    // For content-based searches
    if (results.length > 0) {
      context = 'DOCUMENT CONTENT ANALYSIS:\n\n';
      results.forEach((result: any, index: number) => {
        context += `SOURCE ${index + 1}: ${result.specName || 'Unknown Spec'}`;
        if (result.supplierName) context += ` (${result.supplierName})`;
        if (result.fileName) context += ` - File: ${result.fileName}`;
        if (result.documentType) context += ` (${result.documentType})`;
        context += `\nCONTENT: ${result.content}\n\n`;
      });
      sourceCount = results.length;

      // Create formal citations
      sourceCitations = results
        .map(
          (result: any, index: number) =>
            `[${index + 1}] ${result.specName || 'Unknown Spec'}${result.supplierName ? ` - ${result.supplierName}` : ''}${result.fileName ? ` (${result.fileName})` : ''}`,
        )
        .join('\n');
    } else {
      context = 'NO DOCUMENT CONTENT FOUND for this specific query.';
    }
  }

  // Add metadata matches for compliance searches
  if (metadataMatches && metadataMatches.length > 0) {
    context += '\n\nMETADATA MATCHES:\n';
    metadataMatches.forEach((match: any, index: number) => {
      context += `${index + 1}. ${match.specName}`;
      if (match.supplierName) context += ` (${match.supplierName})`;
      if (match.metadata)
        context += ` - Metadata: ${JSON.stringify(match.metadata)}`;
      context += '\n';
    });
  }

  // Get system statistics for context
  const stats = await getSpecStatistics();

  // Enhanced system prompt with confidence and authority
  const systemPrompt = `You are a confident, authoritative assistant for Schreiber Foods, specializing in supplier specification analysis.

IMPORTANT: You have access to the actual supplier documents and should respond with confidence and authority when providing information from them.

Current situation:
- Query: "${query}"
- Search type: ${searchType}
- Database: ${stats.totalSpecs} specs, ${stats.totalFiles} files
- Sources found: ${sourceCount}
${strategy.specName ? `- Analyzing spec: ${strategy.specName}` : ''}

Document Analysis Results:
${context}

RESPONSE GUIDELINES:
1. **BE CONFIDENT AND AUTHORITATIVE**: When you have document content, state facts definitively. Don't use "appears to be" or "seems like" - you have the actual documents.

2. **CITE SOURCES PROPERLY**: Always include specific document references like:
   - "According to the YC specification document..."
   - "The allergen declaration for [Spec Name] states..."
   - "Based on the MSDS document for [Spec Name]..."

3. **CONVERSATION CONTEXT**: Pay attention to previous messages. If someone asks follow-up questions like "what are the allergens mentioned", refer back to the previously discussed specification.

4. **DIRECT ANSWERS**: 
   - If documents contain the information, provide it directly and confidently
   - Don't say "check with the supplier" when you have the supplier's own documents
   - Be specific about what the documents state

5. **WHEN INFORMATION IS LIMITED**: Only when you truly don't have relevant document content should you suggest alternative approaches.

6. **PROFESSIONAL TONE**: Sound like an expert food ingredient analyst who has just reviewed the supplier documentation.

7. **STRUCTURE YOUR RESPONSE**:
   - Lead with the direct answer
   - Provide supporting details from documents
   - Include proper source citations
   - End with practical next steps if relevant

8. **FORMATTING**: Use clear, scannable formatting with bullet points, numbered lists, or clear sections when presenting multiple pieces of information.

CRITICAL: If you found relevant document content (sourceCount > 0), respond with confidence and authority. These are the actual supplier documents - treat them as authoritative sources.

${sourceCitations ? `\nDOCUMENT SOURCES:\n${sourceCitations}` : ''}

Respond professionally and confidently, as if you've just completed a thorough analysis of the supplier documentation.`;

  // Build conversation messages for the AI, including context
  const conversationMessages: any[] = [];

  // If there's conversation history, include it so AI understands the context
  if (messages.length > 1) {
    // Add previous messages to give context
    messages.slice(0, -1).forEach((msg: any) => {
      conversationMessages.push({
        role: msg.role,
        content: msg.content,
      });
    });
  }

  // Add the current query with search results context
  conversationMessages.push({
    role: 'user',
    content: query,
  });

  return streamText({
    model: myProvider.languageModel('chat-model', {
      temperature: 0.1, // Lower temperature for more consistent, confident responses
      maxTokens: 2048,
      presencePenalty: 0,
      frequencyPenalty: 0.1, // Slight penalty to avoid repetitive phrasing
    }),
    system: systemPrompt,
    messages: conversationMessages,
  }).toDataStreamResponse();
}

/**
 * GET endpoint for search statistics and health check
 */
export async function GET() {
  try {
    const stats = await getSpecStatistics();

    return Response.json({
      status: 'healthy',
      statistics: {
        totalSpecs: stats.totalSpecs,
        totalFiles: stats.totalFiles,
        totalChunks: stats.totalChunks,
        processingStats: stats.processingStats,
      },
      searchTypes: [
        'spec_specific - Search within a specific specification',
        'cross_spec - Search across all specifications',
        'compliance - Find specs meeting specific criteria',
        'discovery - Discover specs by supplier or category',
      ],
    });
  } catch (error) {
    console.error('[SPEC-SEARCH] Health check failed:', error);
    return Response.json(
      { status: 'error', message: 'Search service unavailable' },
      { status: 500 },
    );
  }
}
