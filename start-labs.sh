#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Local AI Labs...${NC}"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${BLUE}Starting Ollama server...${NC}"
    ollama serve > /dev/null 2>&1 &
    sleep 2
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
fi

# Start the server
echo -e "${GREEN}✓ Ollama ready${NC}"
echo -e "${GREEN}✓ Starting chat interface...${NC}"
echo ""
node server.js
