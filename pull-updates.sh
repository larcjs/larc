#!/bin/bash
#
# Git Submodules Update Script
# Pulls latest changes from meta repo and all submodules
#
# Usage:
#   ./pull-updates.sh           # Update to latest remote branches
#   ./pull-updates.sh --exact   # Update to exact commits (no branch checkout)
#   ./pull-updates.sh --check   # Just check status, don't update

set -e  # Exit on error

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

MODE="${1:---latest}"

echo -e "${COLOR_BLUE}=== LARC Repository Update ===${COLOR_RESET}\n"

# Function to print colored status
print_status() {
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} $1"
}

print_warning() {
    echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} $1"
}

print_error() {
    echo -e "${COLOR_RED}✗${COLOR_RESET} $1"
}

# Check mode
case "$MODE" in
    --check)
        echo "Checking status only (no updates will be made)..."
        echo ""

        print_status "Meta repo status:"
        git status -sb
        echo ""

        print_status "Submodule status:"
        git submodule status --recursive
        echo ""

        print_status "Checking for unpushed commits in submodules..."
        git submodule foreach --recursive '
            BRANCH=$(git rev-parse --abbrev-ref HEAD)
            if [ "$BRANCH" = "HEAD" ]; then
                echo "  ⚠ $name: DETACHED HEAD"
            else
                UNPUSHED=$(git log origin/$BRANCH..$BRANCH --oneline 2>/dev/null | wc -l)
                if [ $UNPUSHED -gt 0 ]; then
                    echo "  ⚠ $name: $UNPUSHED unpushed commits on $BRANCH"
                else
                    echo "  ✓ $name: up to date on $BRANCH"
                fi
            fi
        '
        exit 0
        ;;

    --exact)
        echo "Updating to exact commits (as specified by meta repo)..."
        echo ""

        print_status "Pulling meta repo..."
        git pull

        print_status "Updating submodules to exact commits..."
        git submodule update --init --recursive

        print_status "Done! All submodules are at exact commits specified by meta repo."
        ;;

    --latest|*)
        echo "Updating to latest remote branches..."
        echo ""

        print_status "Pulling meta repo..."
        git pull --recurse-submodules

        print_status "Updating all submodules to latest remote main branches..."
        git submodule update --init --recursive --remote

        print_status "Checking out main branch in all submodules..."
        git submodule foreach --recursive '
            BRANCH=$(git rev-parse --abbrev-ref HEAD)
            if [ "$BRANCH" = "HEAD" ]; then
                echo "  → Checking out main in $name"
                git checkout main 2>/dev/null || git checkout master 2>/dev/null || echo "  ⚠ Could not checkout main/master in $name"
            fi
        '

        print_status "Done! All repos updated to latest."
        echo ""

        # Check if meta repo needs updating
        if git status --short | grep -q "^.M"; then
            print_warning "Meta repo has changes (submodules moved to newer commits)"
            echo "  You may want to commit these changes:"
            echo "    git add -A"
            echo "    git commit -m 'Update submodules to latest versions'"
            echo "    git push"
        fi
        ;;
esac

echo ""
print_status "Current status:"
git submodule status --recursive | head -20
SUBMODULE_COUNT=$(git submodule status --recursive | wc -l)
if [ $SUBMODULE_COUNT -gt 20 ]; then
    echo "  ... and $((SUBMODULE_COUNT - 20)) more"
fi
