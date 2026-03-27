import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { StateGraph, END, START } from '@langchain/langgraph';
import { ragAgent } from './ragAgent.js';
import { generateChart, ChartToolResult } from '../tools/chartTool.js';
import { GroupedReference } from '../services/weaviateService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Delegating Agent State
 * Tracks the flow through the agent graph
 */
export interface DelegatingAgentState {
  query: string;
  routingDecision?: 'rag' | 'chart' | 'direct' | 'rag_and_chart';
  ragAnswer?: string;
  ragReferences?: GroupedReference[];
  chartData?: ChartToolResult;
  directAnswer?: string;
  finalAnswer?: string;
  finalData?: Array<GroupedReference | ChartToolResult>;
}

/**
 * Main Delegating Agent Class
 * Routes user queries to appropriate tools/agents using LangGraph
 */
export class DelegatingAgent {
  private llm: ChatOpenAI;
  private graph: any; // LangGraph compiled graph

  constructor() {
    // Initialize LLM for routing and direct answers
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.3, // Lower temperature for more consistent routing
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Build the LangGraph workflow
    this.graph = this.buildGraph();
  }

  /**
   * Build the LangGraph state graph
   * Defines nodes and conditional edges for routing
   */
  private buildGraph() {
    const workflow = new StateGraph<DelegatingAgentState>({
      channels: {
        query: null,
        routingDecision: null,
        ragAnswer: null,
        ragReferences: null,
        chartData: null,
        directAnswer: null,
        finalAnswer: null,
        finalData: null,
      },
    });

    // Define nodes
    workflow.addNode('router', this.routerNode.bind(this));
    workflow.addNode('rag', this.ragNode.bind(this));
    workflow.addNode('chart', this.chartNode.bind(this));
    workflow.addNode('direct', this.directAnswerNode.bind(this));
    workflow.addNode('rag_and_chart', this.ragAndChartNode.bind(this));
    workflow.addNode('aggregator', this.aggregatorNode.bind(this));

    // Define edges
    workflow.addEdge(START, 'router');

    // Conditional routing from router node
    workflow.addConditionalEdges(
      'router',
      (state: DelegatingAgentState) => state.routingDecision || 'direct',
      {
        rag: 'rag',
        chart: 'chart',
        direct: 'direct',
        rag_and_chart: 'rag_and_chart',
      }
    );

    // All paths lead to aggregator
    workflow.addEdge('rag', 'aggregator');
    workflow.addEdge('chart', 'aggregator');
    workflow.addEdge('direct', 'aggregator');
    workflow.addEdge('rag_and_chart', 'aggregator');

    // Aggregator leads to end
    workflow.addEdge('aggregator', END);

    return workflow.compile();
  }

  /**
   * Router Node
   * Analyzes query and decides which tool(s) to invoke
   */
  private async routerNode(state: DelegatingAgentState): Promise<Partial<DelegatingAgentState>> {
    console.log('[DelegatingAgent] Router analyzing query...');

    const query = state.query.toLowerCase();

    // Routing logic based on keywords and patterns
    const hasChartKeywords = /chart|graph|visuali[sz]ation|visuali[sz]e|plot|diagram|show.*data|create.*chart|create.*graph/i.test(state.query);
    const hasDataKeywords = /what|how|when|where|why|explain|tell me|information|analyze/i.test(state.query);
    const hasSalesKeywords = /sales|revenue|q1|q2|q3|q4|quarter|product|category/i.test(state.query);

    let decision: 'rag' | 'chart' | 'direct' | 'rag_and_chart';

    // Check for explicit "and" combining data + visualization
    const hasAndCombination = /and.*chart|and.*visuali|and.*graph|chart.*and|visuali.*and|graph.*and/i.test(state.query);

    // Combined: Explicitly asking for both data AND visualization
    if (hasAndCombination && hasChartKeywords && (hasDataKeywords || hasSalesKeywords)) {
      decision = 'rag_and_chart';
      console.log('[DelegatingAgent] Routing to: RAG + Chart (combined)');
    }
    // Chart only: Pure visualization request
    else if (hasChartKeywords) {
      decision = 'chart';
      console.log('[DelegatingAgent] Routing to: Chart tool');
    }
    // RAG: Question about data in knowledge base
    else if (hasDataKeywords && hasSalesKeywords) {
      decision = 'rag';
      console.log('[DelegatingAgent] Routing to: RAG agent');
    }
    // Check if it's likely in our knowledge base (science, tech, history topics)
    else if (/photosynthesis|plant|leaf|chlorophyll|ai|artificial intelligence|neural network|internet|technology/i.test(state.query)) {
      decision = 'rag';
      console.log('[DelegatingAgent] Routing to: RAG agent (topic match)');
    }
    // Direct answer: Simple questions, math, greetings
    else {
      decision = 'direct';
      console.log('[DelegatingAgent] Routing to: Direct answer');
    }

    return { routingDecision: decision };
  }

  /**
   * RAG Node
   * Executes RAG agent for knowledge retrieval
   */
  private async ragNode(state: DelegatingAgentState): Promise<Partial<DelegatingAgentState>> {
    console.log('[DelegatingAgent] Executing RAG agent...');

    const result = await ragAgent.execute(state.query);

    return {
      ragAnswer: result.answer,
      ragReferences: result.data,
    };
  }

  /**
   * Chart Node
   * Generates Chart.js configuration
   */
  private async chartNode(state: DelegatingAgentState): Promise<Partial<DelegatingAgentState>> {
    console.log('[DelegatingAgent] Generating chart...');

    const chartResult = generateChart(state.query);

    return {
      chartData: chartResult,
    };
  }

  /**
   * Direct Answer Node
   * LLM answers directly without tools
   */
  private async directAnswerNode(state: DelegatingAgentState): Promise<Partial<DelegatingAgentState>> {
    console.log('[DelegatingAgent] Generating direct answer...');

    const messages = [
      new SystemMessage('You are a helpful AI assistant. Answer the user\'s question directly and concisely.'),
      new HumanMessage(state.query),
    ];

    const response = await this.llm.invoke(messages);
    const answer = response.content as string;

    return {
      directAnswer: answer,
    };
  }

  /**
   * RAG and Chart Node
   * Executes both RAG and Chart in parallel for combined queries
   */
  private async ragAndChartNode(state: DelegatingAgentState): Promise<Partial<DelegatingAgentState>> {
    console.log('[DelegatingAgent] Executing RAG + Chart in parallel...');

    // Execute both in parallel
    const [ragResult, chartResult] = await Promise.all([
      ragAgent.execute(state.query),
      Promise.resolve(generateChart(state.query)),
    ]);

    return {
      ragAnswer: ragResult.answer,
      ragReferences: ragResult.data,
      chartData: chartResult,
    };
  }

  /**
   * Aggregator Node
   * Combines results from different paths into final response
   */
  private async aggregatorNode(state: DelegatingAgentState): Promise<Partial<DelegatingAgentState>> {
    console.log('[DelegatingAgent] Aggregating results...');

    let finalAnswer = '';
    const finalData: Array<GroupedReference | ChartToolResult> = [];

    // Aggregate based on which nodes executed
    if (state.routingDecision === 'rag') {
      finalAnswer = state.ragAnswer || '';
      if (state.ragReferences) {
        finalData.push(...state.ragReferences);
      }
    } else if (state.routingDecision === 'chart') {
      finalAnswer = `I've generated a ${state.chartData?.config.type} chart for you: ${state.chartData?.description}`;
      if (state.chartData) {
        finalData.push(state.chartData);
      }
    } else if (state.routingDecision === 'direct') {
      finalAnswer = state.directAnswer || '';
    } else if (state.routingDecision === 'rag_and_chart') {
      // Combine RAG answer with chart
      finalAnswer = state.ragAnswer || '';
      finalAnswer += `\n\nI've also generated a visualization: ${state.chartData?.description}`;

      if (state.ragReferences) {
        finalData.push(...state.ragReferences);
      }
      if (state.chartData) {
        finalData.push(state.chartData);
      }
    }

    return {
      finalAnswer,
      finalData,
    };
  }

  /**
   * Main execution method
   * Runs the query through the LangGraph workflow
   */
  async execute(query: string): Promise<{ answer: string; data: Array<GroupedReference | ChartToolResult> }> {
    console.log(`\n[DelegatingAgent] Processing query: "${query}"`);
    console.log('='.repeat(80));

    const initialState: DelegatingAgentState = {
      query,
    };

    // Execute the graph
    const result = await this.graph.invoke(initialState);

    console.log('[DelegatingAgent] Execution complete');
    console.log('='.repeat(80));

    return {
      answer: result.finalAnswer || 'Sorry, I could not generate an answer.',
      data: result.finalData || [],
    };
  }
}

// Export singleton instance
export const delegatingAgent = new DelegatingAgent();
