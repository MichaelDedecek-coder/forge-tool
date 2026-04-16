#!/bin/bash
# NOTIX POC — one-click demo launcher
# Usage: ./run-demo.sh

cd "$(dirname "$0")"

echo "Starting NOTIX POC API server..."
uvicorn api.main:app --host 0.0.0.0 --port 8000 &
SERVER_PID=$!

sleep 2

echo "Opening demo in browser..."
open "http://localhost:8000/api/poc/personas"

echo ""
echo "API running at http://localhost:8000"
echo "  GET /health"
echo "  GET /api/poc/analyze/persona_a"
echo "  GET /api/poc/analyze/persona_b"
echo "  GET /api/poc/analyze/persona_c"
echo ""
echo "Press Ctrl+C to stop."

wait $SERVER_PID
