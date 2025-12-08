#!/bin/bash
#
# Helper script to safely work on a submodule
# Automatically checks out main branch and pulls latest
#
# Usage:
#   ./work-on-submodule.sh apps
#   ./work-on-submodule.sh apps/components

set -e

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

if [ -z "$1" ]; then
    echo -e "${COLOR_RED}Error: Please specify a submodule path${COLOR_RESET}"
    echo ""
    echo "Usage: $0 <submodule-path>"
    echo ""
    echo "Available submodules:"
    git submodule status | sed 's/^./  /'
    exit 1
fi

SUBMODULE_PATH="$1"

if [ ! -d "$SUBMODULE_PATH/.git" ] && [ ! -f "$SUBMODULE_PATH/.git" ]; then
    echo -e "${COLOR_RED}Error: $SUBMODULE_PATH is not a git submodule${COLOR_RESET}"
    exit 1
fi

echo -e "${COLOR_BLUE}=== Preparing $SUBMODULE_PATH for work ===${COLOR_RESET}\n"

cd "$SUBMODULE_PATH"

# Check current status
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
IS_DETACHED=false

if [ "$CURRENT_BRANCH" = "HEAD" ]; then
    IS_DETACHED=true
    echo -e "${COLOR_YELLOW}⚠ Currently in DETACHED HEAD state${COLOR_RESET}"
fi

# Try to checkout main or master
echo -e "${COLOR_GREEN}✓${COLOR_RESET} Checking out main branch..."
if git checkout main 2>/dev/null; then
    MAIN_BRANCH="main"
elif git checkout master 2>/dev/null; then
    MAIN_BRANCH="master"
else
    echo -e "${COLOR_RED}Error: Could not find main or master branch${COLOR_RESET}"
    exit 1
fi

# Pull latest
echo -e "${COLOR_GREEN}✓${COLOR_RESET} Pulling latest changes..."
git pull

# Show status
echo ""
echo -e "${COLOR_GREEN}✓${COLOR_RESET} Ready to work!"
echo ""
echo "  Location: $PWD"
echo "  Branch: $MAIN_BRANCH"
echo "  Remote: $(git remote get-url origin)"
echo ""

# If had detached HEAD, show warning about any uncommitted work
if [ "$IS_DETACHED" = true ]; then
    echo -e "${COLOR_YELLOW}Note: You were in detached HEAD state.${COLOR_RESET}"
    echo "If you had uncommitted changes, check 'git reflog' to recover them."
    echo ""
fi

# Show recent commits
echo "Recent commits:"
git log --oneline -5 --color=always | sed 's/^/  /'
echo ""

# Show any uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${COLOR_YELLOW}⚠ You have uncommitted changes:${COLOR_RESET}"
    git status --short | sed 's/^/  /'
    echo ""
fi

echo "You can now make changes. When done:"
echo "  1. git add <files>"
echo "  2. git commit -m 'Your message'"
echo "  3. git push"
echo "  4. cd .. && git add $SUBMODULE_PATH && git commit -m 'Update $SUBMODULE_PATH submodule'"
