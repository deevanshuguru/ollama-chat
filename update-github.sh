#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Updating GitHub repository...${NC}"

# Check if there are changes
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}No changes to commit${NC}"
    exit 0
fi

# Show status
echo -e "${BLUE}Changes detected:${NC}"
git status -s

# Add all changes
git add -A

# Prompt for commit message
echo ""
read -p "Commit message (or press Enter for auto-generated): " commit_msg

# Generate timestamp-based message if empty
if [[ -z "$commit_msg" ]]; then
    commit_msg="Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Commit
git commit -m "$commit_msg"

# Push to GitHub
echo -e "${BLUE}Pushing to GitHub...${NC}"
git push origin main

echo -e "${GREEN}✓ GitHub repository updated!${NC}"
echo -e "${GREEN}✓ View at: https://github.com/deevanshuguru/ollama-chat${NC}"
