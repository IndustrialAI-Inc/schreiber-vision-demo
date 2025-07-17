import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import {
  semanticSearchDocumentChunks,
  advancedSemanticSearch,
} from '../db/queries';

export interface SearchOptions {
  limit?: number;
  similarityThreshold?: number;
  fileIds?: string[];
  metadataFilters?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  fileId: string;
  content: string;
  metadata: any;
  chunkIndex: number;
  similarity: number;
}

export class SearchService {
  private readonly embeddingModel = openai.embedding('text-embedding-3-small');

  /**
   * Perform semantic search using natural language query
   */
  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateQueryEmbedding(query);

      const results = await semanticSearchDocumentChunks({
        queryEmbedding,
        limit: options.limit,
        similarityThreshold: options.similarityThreshold,
        fileIds: options.fileIds,
      });

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Perform advanced semantic search with metadata filtering
   */
  async advancedSearch(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.generateQueryEmbedding(query);

      const results = await advancedSemanticSearch({
        queryEmbedding,
        limit: options.limit,
        similarityThreshold: options.similarityThreshold,
        fileIds: options.fileIds,
        metadataFilters: options.metadataFilters,
      });

      return results;
    } catch (error) {
      console.error('Advanced search failed:', error);
      throw error;
    }
  }

  /**
   * Search within specific supplier documents
   */
  async searchSupplierDocuments(
    query: string,
    supplierFileIds: string[],
    options: Omit<SearchOptions, 'fileIds'> = {},
  ): Promise<SearchResult[]> {
    return this.search(query, {
      ...options,
      fileIds: supplierFileIds,
    });
  }

  /**
   * Find documents similar to a given document chunk
   */
  async findSimilarChunks(
    sourceChunkId: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    try {
      // First, get the source chunk to extract its embedding
      const { getDocumentChunksByFileId } = await import('../db/queries');

      // This is a simplified approach - in a real implementation, you'd want a
      // getDocumentChunkById function. For now, we'll throw an error to indicate
      // this needs to be implemented.
      throw new Error(
        'findSimilarChunks requires getDocumentChunkById function to be implemented',
      );
    } catch (error) {
      console.error(
        `[SearchService] Failed to find similar chunks for: ${sourceChunkId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generate embedding for a search query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const { embedding } = await embed({
        model: this.embeddingModel,
        value: query,
      });

      return embedding;
    } catch (error) {
      console.error('Failed to generate query embedding:', error);
      throw new Error(
        `Failed to generate embedding for query: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Batch search multiple queries efficiently
   */
  async batchSearch(
    queries: string[],
    options: SearchOptions = {},
  ): Promise<{ query: string; results: SearchResult[] }[]> {
    try {
      const embeddings = await Promise.all(
        queries.map((query) => this.generateQueryEmbedding(query)),
      );

      const searchPromises = embeddings.map((embedding, index) =>
        semanticSearchDocumentChunks({
          queryEmbedding: embedding,
          limit: options.limit,
          similarityThreshold: options.similarityThreshold,
          fileIds: options.fileIds,
        }).then((results) => ({
          query: queries[index],
          results,
        })),
      );

      const batchResults = await Promise.all(searchPromises);
      return batchResults;
    } catch (error) {
      console.error('Batch search failed:', error);
      throw error;
    }
  }

  /**
   * Search with automatic query expansion and refinement
   */
  async intelligentSearch(
    query: string,
    options: SearchOptions = {},
  ): Promise<{
    primary: SearchResult[];
    expanded: SearchResult[];
    totalResults: number;
  }> {
    try {
      const primaryResults = await this.search(query, options);

      const expandedQueries = this.generateExpandedQueries(query);

      const expandedOptions = {
        ...options,
        similarityThreshold: (options.similarityThreshold || 0.1) * 0.7,
        limit: Math.floor((options.limit || 10) / 2),
      };

      const expandedSearches = await this.batchSearch(
        expandedQueries,
        expandedOptions,
      );
      const expandedResults = expandedSearches.flatMap(
        (result) => result.results,
      );

      const primaryIds = new Set(primaryResults.map((r) => r.id));
      const uniqueExpandedResults = expandedResults.filter(
        (result) => !primaryIds.has(result.id),
      );

      return {
        primary: primaryResults,
        expanded: uniqueExpandedResults,
        totalResults: primaryResults.length + uniqueExpandedResults.length,
      };
    } catch (error) {
      console.error('Intelligent search failed:', error);
      throw error;
    }
  }

  /**
   * Generate expanded search queries for better coverage
   */
  private generateExpandedQueries(originalQuery: string): string[] {
    const words = originalQuery.toLowerCase().split(/\s+/);
    const expandedQueries: string[] = [];

    const importantWords = words.filter(
      (word) =>
        word.length > 3 &&
        ![
          'the',
          'and',
          'or',
          'but',
          'in',
          'on',
          'at',
          'to',
          'for',
          'of',
          'with',
          'by',
        ].includes(word),
    );

    importantWords.forEach((word) => {
      expandedQueries.push(word);
    });

    if (words.length > 2) {
      for (let i = 0; i < words.length - 1; i++) {
        expandedQueries.push(`${words[i]} ${words[i + 1]}`);
      }
    }

    return expandedQueries.slice(0, 3);
  }
}
