import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { delegatingAgent } from './agents/delegatingAgent.js';
import { weaviateService } from './services/weaviateService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * SSE Streaming endpoint
 * Streams agent responses in real-time using Server-Sent Events
 */
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required and must be a string' });
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`[Server] ⚡ New SSE Request`);
  console.log(`[Server] Query: "${query}"`);
  console.log(`${'='.repeat(80)}`);

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Keep connection alive
  res.flushHeaders();

  try {
    // Execute delegating agent
    const result = await delegatingAgent.execute(query);

    // Stream the answer
    // For now, we send the complete answer in chunks
    // In a production system, this would be token-by-token streaming from LLM
    const answer = result.answer;
    const chunkSize = 50; // Characters per chunk

    // Send answer in chunks to simulate streaming
    for (let i = 0; i < answer.length; i += chunkSize) {
      const chunk = answer.slice(i, i + chunkSize);

      // SSE format: data: <content>\n\n
      const sseEvent = {
        type: 'answer_chunk',
        chunk,
      };

      res.write(`data: ${JSON.stringify(sseEvent)}\n\n`);

      // Small delay to simulate real streaming
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    // Send data references at the end
    if (result.data.length > 0) {
      const dataEvent = {
        type: 'data',
        data: result.data,
      };

      res.write(`data: ${JSON.stringify(dataEvent)}\n\n`);
    }

    // Send completion event
    const doneEvent = {
      type: 'done',
    };

    res.write(`data: ${JSON.stringify(doneEvent)}\n\n`);

    console.log(`\n[Server] ✓ Stream completed successfully`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('[Server] Error during streaming:', error);

    // Send error event
    const errorEvent = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
  } finally {
    // Close connection
    res.end();
  }
});

/**
 * Non-streaming endpoint (for comparison/fallback)
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required and must be a string' });
  }

  console.log(`\n[Server] Received request: "${query}"`);

  try {
    const result = await delegatingAgent.execute(query);

    res.json({
      answer: result.answer,
      data: result.data,
    });

  } catch (error) {
    console.error('[Server] Error:', error);

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const weaviateHealthy = await weaviateService.healthCheck();

    res.json({
      status: 'ok',
      services: {
        weaviate: weaviateHealthy ? 'healthy' : 'unhealthy',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Multi-Agent RAG System API',
    version: '1.0.0',
    endpoints: {
      'POST /api/chat/stream': 'SSE streaming chat endpoint',
      'POST /api/chat': 'Non-streaming chat endpoint',
      'GET /api/health': 'Health check',
    },
    documentation: 'See README.md for API documentation',
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 Multi-Agent RAG System Server');
  console.log('='.repeat(80));
  console.log(`\n📍 Server running on http://localhost:${PORT}`);
  console.log('\n📡 Available endpoints:');
  console.log(`   - POST http://localhost:${PORT}/api/chat/stream (SSE)`);
  console.log(`   - POST http://localhost:${PORT}/api/chat`);
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
  console.log(`   - GET  http://localhost:${PORT}/`);
  console.log('\n💡 Example curl command:');
  console.log(`   curl -X POST http://localhost:${PORT}/api/chat/stream \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"query": "What is photosynthesis?"}'`);
  console.log('\n' + '='.repeat(80) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Server] SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n[Server] SIGINT signal received: closing HTTP server');
  process.exit(0);
});
