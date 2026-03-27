import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import dotenv from 'dotenv';

dotenv.config();

export const TENANT_NAME = 'demo_tenant';
export const SIMILARITY_THRESHOLD = 0.55; // Minimum similarity score for relevance (55%)

/**
 * Interface for RAG search results
 */
export interface RAGResult {
  fileId: string;
  answer: string;
  pageNumbers: string[];
  distance?: number; // Cosine distance (lower is more similar)
}

/**
 * Interface for grouped references
 */
export interface GroupedReference {
  fileId: string;
  pageNumbers: number[];
  type: 'rag_reference';
}

/**
 * Weaviate Service Class
 * Handles all interactions with Weaviate vector database
 */
export class WeaviateService {
  private client: WeaviateClient;

  constructor() {
    this.client = weaviate.client({
      scheme: 'http',
      host: 'localhost:8080',
    });
  }

  /**
   * Perform vector search on QnADocument collection
   * @param query - User's search query
   * @param limit - Maximum number of results to return
   * @returns Array of relevant Q&A results
   */
  async vectorSearch(query: string, limit: number = 3): Promise<RAGResult[]> {
    try {
      console.log(`[WeaviateService] Searching for: "${query}"`);

      const result = await this.client.graphql
        .get()
        .withClassName('QnADocument')
        .withTenant(TENANT_NAME)
        .withFields('fileId question answer pageNumbers _additional { distance }')
        .withNearText({ concepts: [query] })
        .withLimit(limit)
        .do();

      const objects = result.data?.Get?.QnADocument || [];

      if (objects.length === 0) {
        console.log('[WeaviateService] No results found');
        return [];
      }

      // Filter by similarity threshold
      // In cosine distance: 0 = identical, 2 = opposite
      // We want distance < (1 - SIMILARITY_THRESHOLD)
      const maxDistance = 1 - SIMILARITY_THRESHOLD;

      const filteredResults: RAGResult[] = objects
        .filter((obj: any) => {
          const distance = obj._additional?.distance || 0;
          return distance <= maxDistance;
        })
        .map((obj: any) => ({
          fileId: obj.fileId,
          answer: obj.answer,
          pageNumbers: obj.pageNumbers,
          distance: obj._additional?.distance,
        }));

      console.log(`[WeaviateService] Found ${filteredResults.length} relevant results (above ${SIMILARITY_THRESHOLD} similarity)`);

      return filteredResults;

    } catch (error) {
      console.error('[WeaviateService] Vector search error:', error);

      // Fallback: Try to fetch objects without vector search
      console.log('[WeaviateService] Attempting fallback to fetchObjects...');
      return await this.fallbackFetchObjects(limit);
    }
  }

  /**
   * Fallback method if vector search fails
   * Fetches objects without semantic search
   */
  private async fallbackFetchObjects(limit: number): Promise<RAGResult[]> {
    try {
      const result = await this.client.graphql
        .get()
        .withClassName('QnADocument')
        .withTenant(TENANT_NAME)
        .withFields('fileId question answer pageNumbers')
        .withLimit(limit)
        .do();

      const objects = result.data?.Get?.QnADocument || [];

      return objects.map((obj: any) => ({
        fileId: obj.fileId,
        answer: obj.answer,
        pageNumbers: obj.pageNumbers,
      }));

    } catch (error) {
      console.error('[WeaviateService] Fallback fetch failed:', error);
      return [];
    }
  }

  /**
   * Group RAG results by fileId for cleaner reference formatting
   * Converts multiple results from same file into grouped reference
   *
   * Example:
   * Input: [
   *   { fileId: "1", pageNumbers: ["3", "5"] },
   *   { fileId: "1", pageNumbers: ["7"] },
   *   { fileId: "2", pageNumbers: ["12"] }
   * ]
   * Output: [
   *   { fileId: "1", pageNumbers: [3, 5, 7], type: "rag_reference" },
   *   { fileId: "2", pageNumbers: [12], type: "rag_reference" }
   * ]
   */
  groupReferencesByFileId(results: RAGResult[]): GroupedReference[] {
    const grouped = new Map<string, Set<number>>();

    for (const result of results) {
      if (!grouped.has(result.fileId)) {
        grouped.set(result.fileId, new Set());
      }

      const pageSet = grouped.get(result.fileId)!;

      // Convert string page numbers to integers and add to set
      for (const pageStr of result.pageNumbers) {
        const pageNum = parseInt(pageStr, 10);
        if (!isNaN(pageNum)) {
          pageSet.add(pageNum);
        }
      }
    }

    // Convert to array of GroupedReference objects
    const references: GroupedReference[] = [];

    for (const [fileId, pageSet] of grouped.entries()) {
      references.push({
        fileId,
        pageNumbers: Array.from(pageSet).sort((a, b) => a - b), // Sort pages numerically
        type: 'rag_reference',
      });
    }

    return references;
  }

  /**
   * Format grouped references into human-readable citation format
   * Example: "1- Page 3, 5, 7" or "2- Page 12"
   */
  formatReferences(references: GroupedReference[]): string[] {
    return references.map(ref => {
      const pages = ref.pageNumbers.join(', ');
      return `${ref.fileId}- Page ${pages}`;
    });
  }

  /**
   * Check if Weaviate is healthy and reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const meta = await this.client.misc.metaGetter().do();
      return !!meta.version;
    } catch (error) {
      console.error('[WeaviateService] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const weaviateService = new WeaviateService();
