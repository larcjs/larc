#!/bin/bash
#
# Smart push script for submodules
# Ensures submodules are pushed before meta repo
#
# Usage:
#   ./push-submodule-changes.sh          # Interactive mode
#   ./push-submodule-changes.sh --force  # Push everything without prompts

set -e

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

FORCE_MODE=false
if [ "$1" = "--force" ]; then
    FORCE_MODE=true
fi

echo -e "${COLOR_BLUE}=== Checking for unpushed changes ===${COLOR_RESET}\n"

# Arrays to track what needs pushing
SUBMODULES_TO_PUSH=()
META_HAS_CHANGES=false

# Check meta repo
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${COLOR_YELLOW}⚠ Meta repo has uncommitted changes${COLOR_RESET}"
    git status --short | sed 's/^/  /'
    echo ""
fi

UNPUSHED_META=$(git log origin/$(git rev-parse --abbrev-ref HEAD)..HEAD --oneline 2>/dev/null | wc -l)
if [ "$UNPUSHED_META" -gt 0 ]; then
    META_HAS_CHANGES=true
    echo -e "${COLOR_YELLOW}⚠ Meta repo has $UNPUSHED_META unpushed commit(s)${COLOR_RESET}"
fi

# Check all submodules
echo -e "${COLOR_BLUE}Checking submodules...${COLOR_RESET}\n"

while IFS= read -r line; do
    # Parse submodule status (format: " <sha> path (branch)")
    SUBMODULE_PATH=$(echo "$line" | awk '{print $2}')

    # Enter submodule
    if [ -d "$SUBMODULE_PATH" ]; then
        cd "$SUBMODULE_PATH"

        BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

        if [ "$BRANCH" = "HEAD" ]; then
            echo -e "${COLOR_YELLOW}⚠ $SUBMODULE_PATH: DETACHED HEAD (skipping)${COLOR_RESET}"
        else
            # Check for uncommitted changes
            if ! git diff-index --quiet HEAD -- 2>/dev/null; then
                echo -e "${COLOR_YELLOW}⚠ $SUBMODULE_PATH: has uncommitted changes${COLOR_RESET}"
                git status --short | sed 's/^/    /'
            fi

            # Check for unpushed commits
            UNPUSHED=$(git log origin/$BRANCH..$BRANCH --oneline 2>/dev/null | wc -l)
            if [ "$UNPUSHED" -gt 0 ]; then
                echo -e "${COLOR_YELLOW}⚠ $SUBMODULE_PATH: has $UNPUSHED unpushed commit(s) on $BRANCH${COLOR_RESET}"
                git log origin/$BRANCH..$BRANCH --oneline --color=always | sed 's/^/    /'
                SUBMODULES_TO_PUSH+=("$SUBMODULE_PATH")
            fi
        fi

        cd - > /dev/null
    fi
done < <(git submodule status --recursive)

echo ""

# If nothing to push
if [ ${#SUBMODULES_TO_PUSH[@]} -eq 0 ] && [ "$META_HAS_CHANGES" = false ]; then
    echo -e "${COLOR_GREEN}✓ Everything is up to date!${COLOR_RESET}"
    exit 0
fi

# Push submodules first
if [ ${#SUBMODULES_TO_PUSH[@]} -gt 0 ]; then
    echo -e "${COLOR_BLUE}=== Submodules need pushing ===${COLOR_RESET}\n"

    for SUBMODULE in "${SUBMODULES_TO_PUSH[@]}"; do
        echo -e "${COLOR_YELLOW}→ $SUBMODULE${COLOR_RESET}"
    done
    echo ""

    if [ "$FORCE_MODE" = false ]; then
        read -p "Push all submodules? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 1
        fi
    fi

    # Push each submodule
    for SUBMODULE in "${SUBMODULES_TO_PUSH[@]}"; do
        echo -e "${COLOR_GREEN}→ Pushing $SUBMODULE...${COLOR_RESET}"
        cd "$SUBMODULE"
        BRANCH=$(git rev-parse --abbrev-ref HEAD)
        git push origin "$BRANCH"
        cd - > /dev/null
        echo ""
    done

    echo -e "${COLOR_GREEN}✓ All submodules pushed!${COLOR_RESET}\n"

    # Update meta repo to point to new commits
    echo -e "${COLOR_BLUE}Updating meta repo references...${COLOR_RESET}"
    git add -A

    # Generate commit message
    COMMIT_MSG="Update submodule(s): "
    COMMIT_MSG+=$(IFS=', '; echo "${SUBMODULES_TO_PUSH[*]}")

    if git diff --cached --quiet; then
        echo -e "${COLOR_YELLOW}⚠ No changes to commit (submodules already at latest)${COLOR_RESET}"
    else
        git commit -m "$COMMIT_MSG"
        echo -e "${COLOR_GREEN}✓ Meta repo updated${COLOR_RESET}\n"
        META_HAS_CHANGES=true
    fi
fi

# Push meta repo
if [ "$META_HAS_CHANGES" = true ]; then
    UNPUSHED_META=$(git log origin/$(git rev-parse --abbrev-ref HEAD)..HEAD --oneline 2>/dev/null | wc -l)

    if [ "$UNPUSHED_META" -gt 0 ]; then
        echo -e "${COLOR_BLUE}=== Meta repo needs pushing ===${COLOR_RESET}\n"
        echo "Unpushed commits:"
        git log origin/$(git rev-parse --abbrev-ref HEAD)..HEAD --oneline --color=always | sed 's/^/  /'
        echo ""

        if [ "$FORCE_MODE" = false ]; then
            read -p "Push meta repo? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "Aborted."
                exit 1
            fi
        fi

        echo -e "${COLOR_GREEN}→ Pushing meta repo...${COLOR_RESET}"
        BRANCH=$(git rev-parse --abbrev-ref HEAD)
        git push origin "$BRANCH"
        echo ""
        echo -e "${COLOR_GREEN}✓ Meta repo pushed!${COLOR_RESET}"
    fi
fi

echo ""
echo -e "${COLOR_GREEN}✓✓✓ All done! Everything is pushed.${COLOR_RESET}"
