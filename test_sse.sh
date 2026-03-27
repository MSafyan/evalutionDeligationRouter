#!/bin/bash

echo "Test: Chart Generation"
echo "======================"

curl -N -X POST 'http://localhost:3000/api/chat/stream' \
  -H 'Content-Type: application/json' \
  -d '{"query": "Show me a sales chart"}'

echo ""
echo ""
