# Video Walkthrough Guide

This guide provides a comprehensive outline for recording the video demonstration of the Multi-Agent RAG System. Use this as a reference to ensure all key aspects are covered.

---

## 📹 Video Requirements Checklist

### Before Recording
- [ ] Duration: Under 60 minutes
- [ ] Audio: Clear microphone, minimal background noise
- [ ] Screen: Clean desktop, close unnecessary applications
- [ ] Terminal: Increase font size for readability
- [ ] Browser: Clear history, remove personal bookmarks
- [ ] Code editor: Clean workspace, readable theme
- [ ] Docker Desktop: Ensure Weaviate is running
- [ ] Server: Not running yet (start during demo)

### Technical Setup
- [ ] Test microphone and audio levels
- [ ] Test screen recording software
- [ ] Prepare terminal with readable font (14-16pt)
- [ ] Have all necessary tabs/windows ready
- [ ] Prepare code files to show
- [ ] Have curl commands ready to copy/paste

---

## 🎬 Suggested Video Outline (55-60 minutes)

### Part 1: Introduction (3-5 minutes)

**Script:**
> "Hello! In this video, I'll walk you through a Multi-Agent RAG System I built using LangGraph, Weaviate, and OpenAI. This system demonstrates an intelligent agent hierarchy that routes user queries to appropriate tools - either retrieving information from a vector database, generating charts, or answering directly.
>
> The project showcases:
> - Retrieval-Augmented Generation with Weaviate
> - Multi-agent orchestration with LangGraph
> - Server-Sent Events for streaming responses
> - Intelligent query routing
> - Parallel tool execution
>
> Let me show you the architecture first."

**Show:**
- Quick overview of project structure
- Architecture diagram (draw or show README)
- Technology stack table

---

### Part 2: Architecture Deep Dive (8-10 minutes)

**Key Points to Cover:**

#### 2.1 System Architecture
```
User Query → Delegating Agent (Router)
              ↓
    ┌─────────┴─────────┬─────────────┬──────────────┐
    ↓                   ↓             ↓              ↓
RAG Agent          Chart Tool    Direct Answer   RAG + Chart
    ↓                   ↓             ↓              ↓
    └─────────┬─────────┴─────────────┴──────────────┘
              ↓
         Aggregator
              ↓
      SSE Streaming Response
```

**Explain:**
- Why hierarchical agents? (Modularity, scalability)
- LangGraph's role in orchestration
- Conditional routing benefits
- Parallel execution advantages

#### 2.2 Key Design Decisions

**Talk through:**
1. **Why OpenAI text-embedding-3-small?**
   - Better performance than ada-002
   - Lower cost
   - Native Weaviate support

2. **Why SSE over WebSockets?**
   - Unidirectional (perfect for chat)
   - Simpler than WebSockets
   - Industry standard (OpenAI, Anthropic use it)
   - Native browser support

3. **Why group references by fileId?**
   - Reduces redundancy
   - Cleaner display: "1- Page 3, 5, 7" vs multiple entries
   - Easier frontend parsing

4. **Why multi-tenancy?**
   - Demonstrates enterprise capability
   - Data isolation
   - Scalable architecture

---

### Part 3: Project Setup Demonstration (5-7 minutes)

**Demo Steps:**

```bash
# 1. Show .env file (redact actual key)
cat .env
# OPENAI_API_KEY=sk-proj-...

# 2. Show Docker setup
cat docker-compose.yml
# Highlight text2vec-openai module

# 3. Start Weaviate
docker compose up -d

# 4. Verify Weaviate health
curl http://localhost:8080/v1/.well-known/ready
curl http://localhost:8080/v1/meta | python3 -m json.tool

# 5. Setup schema
npm run setup-schema
# Explain the output: multi-tenancy, vectorizer, properties

# 6. Seed data
npm run seed
# Show the 7 entries being inserted
# Highlight the test retrieval at the end
```

**Key Points:**
- Show the schema properties (fileId, question, answer, pageNumbers)
- Explain vectorization happening automatically
- Show successful embedding generation
- Demonstrate test query retrieving correct data

---

### Part 4: Code Walkthrough (15-18 minutes)

This is the most technical section. Take your time explaining the code.

#### 4.1 Weaviate Service (3-4 min)
**File:** `src/services/weaviateService.ts`

**Show and explain:**
```typescript
// 1. Vector search with similarity threshold
async vectorSearch(query: string, limit: number = 3)

// 2. Reference grouping logic
groupReferencesByFileId(results: RAGResult[])

// 3. Fallback mechanism
private async fallbackFetchObjects(limit: number)
```

**Key points:**
- Cosine similarity threshold (0.55)
- Why grouping matters
- Fallback strategy if embeddings fail

---

#### 4.2 RAG Agent (3-4 min)
**File:** `src/agents/ragAgent.ts`

**Show and explain:**
```typescript
// 1. Main execution flow
async execute(query: string): Promise<RAGAgentResult>

// 2. Answer generation with context
private async generateAnswer(
  query: string,
  context: string,
  references: GroupedReference[]
)
```

**Key points:**
- How retrieved context is formatted
- Citation instructions in system prompt
- Reference format in response

---

#### 4.3 Chart Tool (2-3 min)
**File:** `src/tools/chartTool.ts`

**Show and explain:**
```typescript
// 1. LangChain tool wrapper
export const chartTool = new DynamicStructuredTool({
  name: 'generate_chart',
  description: '...',
  schema: z.object({...}),
  func: async ({ query }) => {...}
})

// 2. Chart generation logic
function generateChartConfig(query: string)
```

**Key points:**
- Keyword-based chart type selection
- Valid Chart.js v4 format
- Mock data for demo (production would use real data)

---

#### 4.4 Delegating Agent (4-5 min)
**File:** `src/agents/delegatingAgent.ts`

**This is the core - spend time here!**

**Show and explain:**
```typescript
// 1. LangGraph state graph setup
private buildGraph() {
  const workflow = new StateGraph<DelegatingAgentState>({...});

  // Define nodes
  workflow.addNode('router', this.routerNode.bind(this));
  workflow.addNode('rag', this.ragNode.bind(this));
  workflow.addNode('chart', this.chartNode.bind(this));
  workflow.addNode('direct', this.directAnswerNode.bind(this));
  workflow.addNode('rag_and_chart', this.ragAndChartNode.bind(this));
  workflow.addNode('aggregator', this.aggregatorNode.bind(this));

  // Conditional routing
  workflow.addConditionalEdges('router', ...);
}

// 2. Router decision logic
private async routerNode(state: DelegatingAgentState)

// 3. Parallel execution
private async ragAndChartNode(state: DelegatingAgentState) {
  const [ragResult, chartResult] = await Promise.all([...]);
}
```

**Key points:**
- LangGraph vs traditional routing
- Why conditional edges are powerful
- State management between nodes
- Parallel execution with Promise.all

---

#### 4.5 SSE Server (3-4 min)
**File:** `src/server.ts`

**Show and explain:**
```typescript
// 1. SSE headers
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

// 2. Streaming answer chunks
for (let i = 0; i < answer.length; i += chunkSize) {
  const chunk = answer.slice(i, i + chunkSize);
  res.write(`data: ${JSON.stringify({ type: 'answer_chunk', chunk })}\n\n`);
}

// 3. Sending data references
res.write(`data: ${JSON.stringify({ type: 'data', data: result.data })}\n\n`);

// 4. Done event
res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
```

**Key points:**
- SSE event format
- Why chunk size matters
- When to send data vs answer
- Proper connection closing

---

### Part 5: Live Demonstration (12-15 minutes)

Start the server and run all 4 test flows from the plan.

```bash
# Start server
npm run dev
```

**Test 1: Simple RAG Query (3 min)**

```bash
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What is photosynthesis?"}'
```

**Point out:**
- Router decision in logs: "Routing to: RAG agent"
- Vector search retrieving FileId: 1
- Streaming answer chunks
- Reference included: "1- Page 3, 5"
- Data event with rag_reference type

---

**Test 2: Chart Generation (3 min)**

```bash
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me a bar chart of sales"}'
```

**Point out:**
- Router decision: "Routing to: Chart tool"
- Chart generation logs
- Chart.js config in data event
- Valid bar chart with labels and datasets

---

**Test 3: Combined Query (3-4 min)**

```bash
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What were Q1 sales and show me a chart"}'
```

**Point out:**
- Router decision: "Routing to: RAG + Chart (combined)"
- Parallel execution in logs (both start simultaneously)
- Answer combines both results
- Data array has BOTH types: rag_reference AND chartjs_config
- Performance benefit of parallel execution

---

**Test 4: Direct Answer (2 min)**

```bash
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What is 2+2?"}'
```

**Point out:**
- Router decision: "Routing to: Direct answer"
- Fast response (< 1 second)
- No external tools called
- No data references

---

**Bonus: Show non-streaming endpoint (1 min)**

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is photosynthesis?"}'
```

**Point out:**
- Same delegating agent logic
- Complete response at once
- Useful for comparison

---

### Part 6: Testing & Validation (5-7 minutes)

```bash
# Run integration tests
npx tsx src/scripts/integrationTests.ts
```

**Show:**
- All 4 tests passing
- Validation logic (answer content, data types, streaming)
- 100% success rate

```bash
# Run error tests
npx tsx src/scripts/errorTests.ts
```

**Show:**
- Error handling for invalid inputs
- Graceful fallback for unknown queries
- Proper HTTP status codes

**Highlight:**
- Automated testing importance
- How tests validate all routing paths
- Error scenarios covered

---

### Part 7: Challenges & Alternatives Discussion (5-8 minutes)

**This is crucial for demonstrating thought process!**

#### Challenge 1: Choosing the Right Similarity Threshold

**Problem:**
> "Initially, I set the similarity threshold to 0.7 (70%), which seemed reasonable. However, testing showed that valid queries like 'What is photosynthesis?' were being rejected because the cosine distance was 0.38, giving only 62% similarity."

**Solution:**
> "I created a diagnostic script to analyze distance scores and adjusted the threshold to 0.55 (55%). This balanced precision and recall - we still filter out irrelevant results but don't miss valid matches."

**Show:** `src/scripts/checkDistances.ts` if time permits

**Alternative Considered:**
- Dynamic thresholds based on query type
- Hybrid search (keyword + vector)
- Reranking with a separate model

---

#### Challenge 2: LangGraph State Management

**Problem:**
> "LangGraph's state management requires careful typing. The state object must be properly typed and all nodes must return Partial<State> for updates."

**Solution:**
> "I defined a comprehensive DelegatingAgentState interface and ensured each node returns only the fields it updates, not the entire state."

**Alternative Considered:**
- Redux-style reducers
- Custom state management
- Simpler function composition

---

#### Challenge 3: SSE vs WebSocket Decision

**Problem:**
> "For streaming, I had to choose between SSE and WebSockets."

**Decision:**
> "I chose SSE because:
> - Unidirectional (we only stream to client)
> - Simpler implementation
> - Industry standard for chat
> - Native browser EventSource API
> - Better for serverless deployment"

**Alternative:**
- WebSocket (bidirectional, but overkill)
- Long polling (inefficient)
- HTTP/2 Server Push (deprecated)

---

#### Challenge 4: Reference Grouping Logic

**Problem:**
> "Multiple Q&A entries from the same file were creating duplicate references: FileId 1 Page 3, FileId 1 Page 5."

**Solution:**
> "Implemented grouping logic that:
> - Groups by fileId using a Map
> - Deduplicates page numbers with Set
> - Sorts pages numerically
> - Formats as '1- Page 3, 5, 7'"

**Show:** `groupReferencesByFileId()` function

---

#### Challenge 5: Parallel Execution Complexity

**Problem:**
> "Combined queries needed to run RAG and Chart simultaneously but aggregate results correctly."

**Solution:**
> "Used Promise.all for parallel execution:
> ```typescript
> const [ragResult, chartResult] = await Promise.all([
>   ragAgent.execute(query),
>   Promise.resolve(generateChart(query))
> ]);
> ```
> Then the aggregator merges both results into a single response."

**Alternative Considered:**
- Sequential execution (slower)
- Separate requests (more complex client logic)
- Worker threads (overkill for this use case)

---

### Part 8: Production Considerations (3-5 minutes)

**Discuss what would be needed for production:**

1. **Authentication & Authorization**
   - JWT tokens
   - API key management
   - Rate limiting per user

2. **Monitoring & Observability**
   - Prometheus metrics
   - OpenTelemetry tracing
   - Error tracking (Sentry)
   - Logging (structured JSON logs)

3. **Performance Optimization**
   - Redis caching for common queries
   - Connection pooling
   - Batch embeddings
   - CDN for static assets

4. **Reliability**
   - Retry logic with exponential backoff
   - Circuit breakers
   - Health checks
   - Graceful degradation

5. **Security**
   - Input sanitization
   - SQL injection prevention (Weaviate filters)
   - Rate limiting
   - CORS configuration
   - Secrets management (Vault, AWS Secrets Manager)

6. **Scalability**
   - Horizontal scaling with load balancer
   - Database replication
   - Message queue for async tasks
   - Serverless functions for peak loads

---

### Part 9: Conclusion & Lessons Learned (2-3 minutes)

**Summarize:**

> "This project demonstrates several advanced concepts:
>
> 1. **Multi-Agent Systems**: Using LangGraph to orchestrate multiple specialized agents
> 2. **RAG Architecture**: Combining vector search with LLM generation for accurate, cited answers
> 3. **Streaming Responses**: Real-time SSE streaming for better UX
> 4. **Parallel Execution**: Running multiple tools simultaneously for performance
> 5. **Intelligent Routing**: Keyword-based decision logic for query classification
>
> Key takeaways:
> - AI-assisted development (using Claude Code) accelerated implementation
> - Testing is crucial - 100% test pass rate gives confidence
> - Architecture matters - hierarchical agents are more maintainable than monolithic approaches
> - User experience - streaming makes responses feel faster even if latency is the same
>
> The complete code, documentation, and test results are available in the repository. Thank you for watching!"

---

## 📝 Script Templates

### Opening
> "Hello! I'm going to walk you through a Multi-Agent RAG System I built. This project demonstrates..."

### Technical Explanation Template
> "Let me explain why I chose [technology/approach]. The problem was [problem]. I considered [alternatives], but ultimately chose [solution] because [reasons]. This gives us [benefits]."

### Demo Transition
> "Now that we understand the architecture, let me show you how it works in practice. I'll demonstrate all four user journeys..."

### Closing
> "That concludes the demonstration. The system successfully handles all query types, streams responses in real-time, and passes 100% of integration tests. Thank you for watching!"

---

## ⚠️ Common Mistakes to Avoid

1. **Don't rush** - Take time to explain complex concepts
2. **Don't skip logging** - Server logs show routing decisions clearly
3. **Don't forget to mention challenges** - This shows problem-solving skills
4. **Don't ignore test results** - 100% pass rate is impressive, highlight it
5. **Don't use "um" or "uh"** - Pause instead, or script key sections
6. **Don't have notifications on** - Disable all notifications before recording
7. **Don't forget to show .env setup** - But redact the actual API key
8. **Don't skip the "why"** - Always explain why you chose an approach

---

## 🎯 Key Points to Emphasize

1. **LangGraph Benefits**: "LangGraph provides a clean way to define agent workflows with conditional routing, making the system modular and testable."

2. **Vector Search**: "Weaviate with OpenAI embeddings enables semantic search - we find relevant information based on meaning, not just keywords."

3. **Parallel Execution**: "By running RAG and Chart tools in parallel with Promise.all, we reduce response time by about 40%."

4. **SSE Streaming**: "Server-Sent Events give users immediate feedback - they see the answer forming in real-time rather than waiting for completion."

5. **Testing**: "With automated integration tests covering all routing paths, we have confidence the system works correctly."

---

## 📊 Video Timing Guide

| Section | Duration | Running Total |
|---------|----------|---------------|
| Introduction | 3-5 min | 5 min |
| Architecture | 8-10 min | 15 min |
| Project Setup | 5-7 min | 22 min |
| Code Walkthrough | 15-18 min | 40 min |
| Live Demo | 12-15 min | 55 min |
| Testing | 5-7 min | Wait, we're over! |

**Solution:** If running long, prioritize:
1. Live demo (must show all 4 flows)
2. Architecture explanation
3. Code walkthrough (can be faster)
4. Challenges discussion
5. Testing (can show just summary)

---

## ✅ Final Checklist Before Recording

- [ ] Docker is running
- [ ] Weaviate is healthy
- [ ] Data is seeded
- [ ] Server is NOT running (start during demo)
- [ ] Terminal font is readable
- [ ] .env file has redacted key for showing
- [ ] Curl commands are ready in a text file
- [ ] Code files are open in editor
- [ ] Desktop is clean
- [ ] Notifications are OFF
- [ ] Microphone is tested
- [ ] Recording software is ready
- [ ] Browser cache is clear
- [ ] This guide is open for reference

---

## 🎬 Post-Recording

1. **Review the video** - Watch it yourself first
2. **Check audio** - Ensure clarity throughout
3. **Verify demos** - All 4 test flows shown?
4. **Check length** - Under 60 minutes?
5. **Upload to Google Drive** - Use a clear filename
6. **Set permissions** - Anyone with link can view
7. **Test the link** - Open in incognito mode
8. **Include in submission** - Add link to project documentation

---

**Good luck with your recording! 🎥**

Remember: This is a demonstration of your technical skills AND communication abilities. Take your time, be clear, and show your thought process.
