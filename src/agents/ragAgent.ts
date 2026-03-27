import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { weaviateService, GroupedReference } from '../services/weaviateService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * RAG Agent State Interface
 */
export interface RAGAgentState {
  query: string;
  context?: string;
  answer?: string;
  references?: GroupedReference[];
  error?: string;
}

/**
 * RAG Agent Result Interface
 */
export interface RAGAgentResult {
  answer: string;
  data: GroupedReference[];
}

/**
 * RAG Agent Class
 * Implements Retrieval-Augmented Generation using Weaviate and OpenAI
 */
export class RAGAgent {
  private llm: ChatOpenAI;

  constructor() {
    // Initialize OpenAI LLM for answer generation
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Main RAG execution method
   * Retrieves relevant context from Weaviate and generates answer using LLM
   *
   * @param query - User's question
   * @returns RAG result with answer and references
   */
  async execute(query: string): Promise<RAGAgentResult> {
    console.log(`\n[RAG] ━━━ Starting RAG Pipeline ━━━`);
    console.log(`[RAG] Query: "${query}"`);

    try {
      // Step 1: Retrieve relevant documents from Weaviate
      console.log(`[RAG] Step 1/4: Vector search`);
      const results = await weaviateService.vectorSearch(query, 3);

      if (results.length === 0) {
        console.log('[RAG] ✗ No relevant data found');
        return {
          answer: "I couldn't find any relevant information in the knowledge base to answer your question. Please try rephrasing or ask about a different topic.",
          data: [],
        };
      }

      console.log(`[RAG] ✓ Retrieved ${results.length} documents`);

      // Step 2: Group references by fileId
      console.log(`[RAG] Step 2/4: Grouping references`);
      const groupedReferences = weaviateService.groupReferencesByFileId(results);
      console.log(`[RAG] ✓ Grouped into ${groupedReferences.length} file refs`);
      groupedReferences.forEach(ref => {
        console.log(`[RAG]   File ${ref.fileId}: Pages ${ref.pageNumbers.join(', ')}`);
      });

      // Step 3: Build context from retrieved documents
      console.log(`[RAG] Step 3/4: Building context`);
      const context = results
        .map((result, index) => {
          return `Document ${index + 1} (File: ${result.fileId}, Pages: ${result.pageNumbers.join(', ')}):\n${result.answer}`;
        })
        .join('\n\n');
      console.log(`[RAG] ✓ Context built (${context.length} chars)`);

      // Step 4: Generate answer using LLM with retrieved context
      console.log(`[RAG] Step 4/4: LLM generation`);
      const answer = await this.generateAnswer(query, context, groupedReferences);
      console.log(`[RAG] ✓ Answer generated (${answer.length} chars)`);

      return {
        answer,
        data: groupedReferences,
      };

    } catch (error) {
      console.error('[RAG] ✗ Error:', error);

      return {
        answer: 'An error occurred while processing your request. Please try again.',
        data: [],
      };
    }
  }

  /**
   * Generate answer using LLM with retrieved context
   *
   * @param query - User's question
   * @param context - Retrieved context from vector database
   * @param references - Grouped references for citation
   * @returns Generated answer with inline citations
   */
  private async generateAnswer(
    query: string,
    context: string,
    references: GroupedReference[]
  ): Promise<string> {
    // Format references for citation instructions
    const citationFormat = weaviateService.formatReferences(references);
    const citationInstructions = citationFormat
      .map((ref, index) => `Reference ${index + 1}: ${ref}`)
      .join('\n');

    const systemPrompt = `You are a helpful AI assistant that answers questions based on provided context from a knowledge base.

IMPORTANT INSTRUCTIONS:
1. Answer the user's question using ONLY the information provided in the context below
2. If the context doesn't contain enough information to fully answer the question, acknowledge this
3. At the end of your answer, add a "References:" section citing the sources
4. Use this exact citation format for references:
${citationInstructions}

5. Be concise and accurate
6. Do not make up information not present in the context

Context from knowledge base:
${context}`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(query),
    ];

    console.log(`[RAG] → Calling OpenAI LLM (gpt-4o-mini)...`);
    const response = await this.llm.invoke(messages);
    const answer = response.content as string;
    console.log(`[RAG] ✓ LLM response received`);

    return answer;
  }

  /**
   * Stream answer generation (for future SSE implementation)
   * Currently returns the full answer, but structured for streaming
   */
  async *streamAnswer(query: string): AsyncGenerator<{ chunk: string; references?: GroupedReference[] }> {
    const result = await this.execute(query);

    // For now, yield the complete answer
    // In Phase 6, we'll implement token-by-token streaming
    yield { chunk: result.answer };

    // Yield references at the end
    yield { chunk: '', references: result.data };
  }
}

// Export singleton instance
export const ragAgent = new RAGAgent();
