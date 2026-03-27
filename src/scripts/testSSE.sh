#!/bin/bash

# Test SSE Streaming Endpoint

echo "Testing SSE Streaming Endpoint"
echo "================================"
echo ""

# Test 1: Simple RAG query
echo "Test 1: RAG Query (Photosynthesis)"
echo "-----------------------------------"
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What is photosynthesis?"}'

echo -e "\n\n"

# Test 2: Chart generation
echo "Test 2: Chart Generation"
echo "------------------------"
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me a bar chart of sales"}'

echo -e "\n\n"

# Test 3: Direct answer
echo "Test 3: Direct Answer"
echo "---------------------"
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What is 5 + 3?"}'

echo -e "\n\n"

# Test 4: Combined RAG + Chart
echo "Test 4: Combined RAG + Chart"
echo "-----------------------------"
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What were Q1 sales and show me a chart"}'

echo -e "\n\n"
echo "All tests completed!"
