#!/bin/bash

echo "Test: Combined RAG + Chart"
echo "=========================="

curl -N -X POST 'http://localhost:3000/api/chat/stream' \
  -H 'Content-Type: application/json' \
  -d '{"query": "What were Q1 sales and show me a chart"}'

echo ""
echo ""
