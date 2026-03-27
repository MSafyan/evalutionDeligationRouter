# Multi-Agent RAG System - Implementation Plan

## Project Overview
Build a hierarchical agent system using LangGraph that routes user queries through a delegating agent to either:
- Answer directly
- Query a Weaviate vector database (RAG)
- Generate Chart.js configurations
- Combine multiple tools

**Technologies**: Node.js, Docker, Weaviate, LangGraph, LangChain, OpenAI Embeddings, SSE Streaming

---

## Phase 0: Project Setup & Dependencies
**Goal**: Initialize Node.js project with all required dependencies

### Tasks
- [ ] Initialize npm project (`package.json`)
- [ ] Install core dependencies:
  - `weaviate-ts-client` - Weaviate JavaScript client
  - `@langchain/langgraph` - Agent hierarchy framework
  - `@langchain/core` - LangChain core utilities
  - `@langchain/openai` - OpenAI integration for LLM and embeddings
  - `express` - Web server for SSE endpoint
  - `dotenv` - Environment variables
  - Development: `typescript`, `@types/node`, `tsx`, `nodemon`
- [ ] Create project structure:
  ```
  /src
    /agents         # LangGraph agents
    /tools          # Chart.js and other tools
    /services       # Weaviate service
    /config         # Configuration files
  /docker          # Docker compose files
  ```
- [ ] Setup TypeScript configuration
- [ ] Create `.gitignore` for node_modules, .env

### Success Criteria
✅ `npm install` runs successfully
✅ TypeScript compiles without errors
✅ Project structure is organized

### Issues & Challenges
*To be documented during implementation*

---

## Phase 1: Weaviate Docker Setup
**Goal**: Configure and run Weaviate vector database with OpenAI embeddings

### Tasks
- [ ] Create `docker-compose.yml` with:
  - Weaviate container (latest version)
  - `text2vec-openai` module enabled for embeddings
  - Proper environment variables (OPENAI_API_KEY)
  - Port mapping (8080:8080)
  - Persistence volume for data
- [ ] Start Weaviate: `docker compose up -d`
- [ ] Verify Weaviate is running (http://localhost:8080/v1/.well-known/ready)
- [ ] Create multi-tenant schema with class `QnADocument`:
  - **Properties**:
    - `fileId` (text, skip vectorization, no index)
    - `question` (text, vectorized)
    - `answer` (text, vectorized)
    - `pageNumbers` (text[], not vectorized)
  - **Multi-tenancy**: Enable tenant isolation
  - **Vectorizer**: `text2vec-openai` (model: `text-embedding-3-small`)

### Success Criteria
✅ Weaviate container running and healthy
✅ Schema created with multi-tenancy enabled
✅ OpenAI vectorizer configured correctly
✅ Can query Weaviate API successfully

### Issues & Challenges
*To be documented during implementation*

---

## Phase 2: Seed Weaviate with Fictional Data
**Goal**: Insert at least 3 fictional Q&A entries with proper embeddings

### Tasks
- [ ] Create data seeding script (`src/scripts/seedData.ts`)
- [ ] Create tenant (e.g., "demo_tenant")
- [ ] Insert 3+ fictional entries covering different topics:
  - **Entry 1**: Science topic (e.g., photosynthesis)
    - fileId: "1", question: "...", answer: "...", pageNumbers: ["3", "5"]
  - **Entry 2**: Business/Sales topic (for chart testing)
    - fileId: "2", question: "...", answer: "...", pageNumbers: ["7"]
  - **Entry 3**: General knowledge
    - fileId: "3", question: "...", answer: "...", pageNumbers: ["12"]
- [ ] Verify embeddings are generated automatically by Weaviate
- [ ] Test retrieval with sample queries

### Success Criteria
✅ 3+ entries inserted successfully
✅ Embeddings auto-generated via OpenAI
✅ Can retrieve objects using Weaviate client
✅ Vector search returns relevant results

### Issues & Challenges
*To be documented during implementation*

---

## Phase 3: RAG Agent Implementation
**Goal**: Build retrieval-augmented generation agent that queries Weaviate

### Tasks
- [ ] Create `src/services/weaviateService.ts`:
  - Weaviate client initialization
  - Vector search function with similarity threshold
  - Fallback to `fetchObjects` if embeddings fail
  - Return format: `{ fileId, answer, pageNumbers }[]`
- [ ] Create `src/agents/ragAgent.ts`:
  - LangChain/LangGraph node for RAG
  - Query Weaviate for relevant chunks
  - Format response with file references
  - Group references by fileId: `{ fileId: "1", pageNumbers: [3, 5], type: "rag_reference" }`
- [ ] Implement reference formatting: "1- Page 3, 5" format in answer
- [ ] Handle cases where no relevant data found

### Success Criteria
✅ RAG agent retrieves relevant data from Weaviate
✅ Returns structured response with answer + data references
✅ Handles empty results gracefully
✅ File references grouped by fileId

### Issues & Challenges
*To be documented during implementation*

---

## Phase 4: Chart.js Tool Implementation
**Goal**: Create mock tool that returns Chart.js configuration

### Tasks
- [ ] Create `src/tools/chartTool.ts`:
  - Mock function that generates Chart.js config
  - Input: User query (parsed for chart type/data)
  - Output: Fixed mock configuration for simplicity
  - Example output:
    ```javascript
    {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar"],
        datasets: [{
          label: "Sales",
          data: [100, 150, 200]
        }]
      },
      options: { responsive: true }
    }
    ```
- [ ] Register as LangChain tool for LangGraph
- [ ] Test tool independently

### Success Criteria
✅ Tool returns valid Chart.js configuration
✅ Can be called from LangGraph agent
✅ Mock data is reasonable and well-formatted

### Issues & Challenges
*To be documented during implementation*

---

## Phase 5: Delegating Agent (Main Router)
**Goal**: Build hierarchical agent that routes to RAG, Chart.js, or direct answer

### Tasks
- [ ] Create `src/agents/delegatingAgent.ts`:
  - Define LangGraph graph with nodes:
    - **Router node**: Decides which tool(s) to call based on query
    - **RAG node**: Calls RAG agent
    - **Chart node**: Calls Chart.js tool
    - **Direct answer node**: LLM answers directly
    - **Aggregator node**: Combines results from multiple tools
  - Use OpenAI LLM for routing decisions
  - Implement conditional edges based on query analysis
- [ ] Routing logic:
  - Keywords like "chart", "graph", "visualize" → Chart.js tool
  - Questions about facts/data in DB → RAG agent
  - Simple questions (math, greetings) → Direct answer
  - Complex queries → Both RAG + Chart in parallel
- [ ] Implement parallel tool execution when needed
- [ ] Aggregate results into unified response format

### Success Criteria
✅ Agent correctly routes simple queries to direct answer
✅ Agent calls RAG for database queries
✅ Agent calls Chart.js for visualization requests
✅ Agent handles combined queries (RAG + Chart)
✅ Returns unified response format

### Issues & Challenges
*To be documented during implementation*

---

## Phase 6: SSE Streaming Response System
**Goal**: Implement Server-Sent Events endpoint for streaming responses

### Tasks
- [ ] Create `src/server.ts`:
  - Express server setup
  - SSE endpoint: `POST /api/chat/stream`
  - Set headers:
    ```javascript
    'Content-Type': 'text/event-stream'
    'Cache-Control': 'no-cache'
    'Connection': 'keep-alive'
    ```
- [ ] Stream response format:
  ```javascript
  {
    answer: string,    // Streamed chunks of agent answer
    data: object[]     // References (RAG or Chart.js config)
  }
  ```
- [ ] Implement streaming:
  - Stream answer token-by-token from LLM
  - Send data references at the end
  - Send `[DONE]` event when complete
- [ ] Handle connection errors and timeouts
- [ ] Add CORS for frontend testing

### Success Criteria
✅ SSE endpoint streams responses correctly
✅ Answer chunks arrive in real-time
✅ Data references included in final event
✅ Connection closes gracefully
✅ Can test with curl or Postman

### Issues & Challenges
*To be documented during implementation*

---

## Phase 7: Integration & End-to-End Testing
**Goal**: Test all user journeys and ensure system works end-to-end

### Test Flows

#### Test 1: Simple RAG Query
```bash
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What is photosynthesis?"}'

Expected:
- Streamed answer from RAG agent
- Data includes: [{ fileId: "1", pageNumbers: [3, 5], type: "rag_reference" }]
```

#### Test 2: Chart Generation
```bash
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me a bar chart of sales data"}'

Expected:
- Streamed answer about chart
- Data includes: [{ type: "chartjs_config", config: {...} }]
```

#### Test 3: Combined Query
```bash
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What were Q1 sales and create a chart?"}'

Expected:
- Streamed answer combining both
- Data includes: RAG references + Chart.js config
```

#### Test 4: Direct Answer
```bash
curl -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What is 2+2?"}'

Expected:
- Streamed answer: "4"
- Data: []
```

### Tasks
- [ ] Run all 4 test flows
- [ ] Verify streaming works correctly
- [ ] Verify reference format matches requirements
- [ ] Test error scenarios (empty DB, invalid queries)
- [ ] Performance test (response time < 3s for simple queries)

### Success Criteria
✅ All 4 test flows pass
✅ Responses match expected format
✅ No errors in console
✅ Docker containers stable

### Issues & Challenges
*To be documented during implementation*

---

## Phase 8: Documentation & Preparation for Submission
**Goal**: Prepare all documentation and materials (video recording will be done by user separately)

### Tasks
- [ ] Create `README.md`:
  - Project overview
  - Setup instructions (Docker, npm install, env vars)
  - How to run the system
  - API endpoint documentation
  - Test examples with curl commands
  - Architecture explanation
- [ ] Add code comments explaining key decisions
- [ ] Update this plan.md with all issues/challenges faced
- [ ] Prepare `VIDEO_GUIDE.md` for user's video walkthrough:
  - Suggested outline and key points to cover
  - Architecture diagram/explanation
  - Demo script for each test flow
  - Challenges and alternatives to discuss
  - Code walkthrough sections to highlight
  - Video requirements checklist:
    - Under 60 minutes
    - Clear audio
    - Shows entire process
    - Explains thought process and challenges

### Success Criteria
✅ README is comprehensive and clear
✅ Code is well-commented with explanations
✅ VIDEO_GUIDE.md provides clear outline for user
✅ All documentation ready for submission
✅ System is fully functional and tested

**Note**: Video recording and uploading to Google Drive will be handled by the user separately

### Issues & Challenges
*To be documented during implementation*

---

## Key Decisions & Architecture

### 1. Embedding Model
**Decision**: OpenAI `text-embedding-3-small`
**Reasoning**:
- Better performance than ada-002
- Lower cost
- Native Weaviate support
- Client has OpenAI API key available

### 2. Streaming Implementation
**Decision**: Server-Sent Events (SSE)
**Reasoning**:
- Industry standard (used by OpenAI, Anthropic)
- Unidirectional (perfect for chat)
- Simple HTTP, no WebSocket complexity
- Native browser support

### 3. Reference Grouping
**Decision**: Group by fileId with array of pageNumbers
**Format**: `{ fileId: "1", pageNumbers: [3, 5, 7], type: "rag_reference" }`
**Reasoning**:
- Reduces redundancy
- Cleaner for display: "1- Page 3, 5, 7"
- Easier to parse on frontend

### 4. LangGraph Architecture
**Decision**: Conditional graph with router node
**Flow**:
```
User Query → Router → [RAG Agent | Chart Tool | Direct Answer | Parallel Combo]
                            ↓
                      Aggregator → Stream Response
```
**Reasoning**:
- Flexible routing based on query intent
- Supports parallel tool execution
- Easy to extend with more tools

### 5. Multi-Tenancy
**Decision**: Single tenant "demo_tenant" for this assessment
**Reasoning**:
- Demonstrates multi-tenancy capability
- Keeps scope manageable
- Easy to extend to multiple tenants later

---

## Technology Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 18+ |
| Language | TypeScript | 5.x |
| Vector DB | Weaviate | Latest (Docker) |
| Agent Framework | LangGraph | Latest |
| LLM Integration | LangChain | Latest |
| LLM Provider | OpenAI | GPT-4 |
| Embeddings | OpenAI | text-embedding-3-small |
| Web Server | Express | 4.x |
| Streaming | SSE | Native |

---

## Project Timeline Estimate

*Note: User requested NO time estimates, this is purely for phase dependency understanding*

**Dependencies**:
- Phase 0 → All other phases
- Phase 1 → Phase 2, 3
- Phase 2 → Phase 3, 7
- Phase 3, 4 → Phase 5
- Phase 5 → Phase 6
- Phase 6 → Phase 7
- Phase 7 → Phase 8

**Critical Path**: 0 → 1 → 2 → 3 → 5 → 6 → 7 → 8

---

## Risk Mitigation

### Risk 1: Weaviate Connection Issues
- **Mitigation**: Test Docker setup early, use health checks, fallback to fetchObjects

### Risk 2: OpenAI API Rate Limits
- **Mitigation**: Use small embedding model, cache responses, add retry logic

### Risk 3: LangGraph Learning Curve
- **Mitigation**: Start with simple graph, reference docs, build incrementally

### Risk 4: Streaming Complexity
- **Mitigation**: Test SSE independently first, use simple events

### Risk 5: Video Time Constraint (60 min)
- **Mitigation**: Script outline beforehand, practice once, focus on key points

---

## Session Tracking Template

### Session [Number] - [Date]
**Phase**: [Phase Name]
**Duration**: [Time spent]
**Goal**: [What we planned to accomplish]

**Work Completed**:
- [ ] Task 1
- [ ] Task 2

**Issues Encountered**:
1. [Issue description]
   - **Solution**: [How we resolved it]
   - **Alternative Considered**: [What else we tried]

**Challenges**:
1. [Challenge description]
   - **Why challenging**: [Root cause]
   - **Learning**: [What we learned]

**Decisions Made**:
1. [Decision]
   - **Reasoning**: [Why]
   - **Trade-offs**: [Pros/cons]

**Next Session**:
- [ ] Continue with [specific task]
- [ ] Address [open issue]

---

## Notes & Observations
*To be filled during implementation*

### What Worked Well
- TBD

### What Could Be Improved
- TBD

### Key Learnings
- TBD

### Code Patterns to Reuse
- TBD

---

## Final Checklist Before Submission

### Implementation Checklist (AI-Assisted Development)
- [ ] All 8 phases completed
- [ ] All test flows pass
- [ ] Code is clean and commented
- [ ] No hardcoded secrets (use .env)
- [ ] README is comprehensive
- [ ] VIDEO_GUIDE.md created with outline
- [ ] All challenges documented in this plan.md
- [ ] Project demonstrates AI-assisted development (Cursor/Windsurf)

### User's Video Checklist (Done Separately)
- [ ] Record walkthrough following VIDEO_GUIDE.md
- [ ] Explain approach and thought process
- [ ] Demonstrate all test flows
- [ ] Discuss challenges and alternatives
- [ ] Show code and architecture
- [ ] Ensure video is under 60 minutes
- [ ] Ensure clear audio
- [ ] Upload to Google Drive

---

**Plan Created**: 2026-03-27
**Status**: Ready to Begin Phase 0
