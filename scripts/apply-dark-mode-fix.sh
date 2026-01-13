#!/bin/bash

# Apply Dark Mode Fix to All Public-Facing Pages
# This script adds theme-init.js and theme components to HTML files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LARC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
THEME_INIT_PATH="/playground/theme-init.js"

echo "🌙 LARC Dark Mode Auto-Fix Script"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
FIXED=0
SKIPPED=0
ERRORS=0

# Function to check if file already has dark mode fix
has_dark_mode_fix() {
    local file="$1"
    grep -q "theme-init.js" "$file" && return 0
    return 1
}

# Function to check if file has a <head> tag
has_head_tag() {
    local file="$1"
    grep -qi "<head" "$file" && return 0
    return 1
}

# Function to check if file has a <body> tag
has_body_tag() {
    local file="$1"
    grep -qi "<body" "$file" && return 0
    return 1
}

# Function to apply fix to a single file
apply_fix() {
    local file="$1"

    # Skip if already fixed
    if has_dark_mode_fix "$file"; then
        echo -e "${YELLOW}  ⊘ SKIP${NC} $file (already has theme-init.js)"
        ((SKIPPED++))
        return
    fi

    # Skip if no <head> tag
    if ! has_head_tag "$file"; then
        echo -e "${YELLOW}  ⊘ SKIP${NC} $file (no <head> tag)"
        ((SKIPPED++))
        return
    fi

    # Create backup
    cp "$file" "$file.bak"

    # Calculate relative path to theme-init.js
    local file_dir="$(dirname "$file")"
    local rel_path="$(realpath --relative-to="$file_dir" "$LARC_ROOT/playground")"
    local theme_script_path="${rel_path}/theme-init.js"

    # Apply fix using sed
    # 1. Add theme-init.js after <head> or charset
    if grep -qi '<meta charset=' "$file"; then
        sed -i '/<meta charset=/a\  <!-- CRITICAL: Load theme BEFORE CSS to prevent flash -->\n  <script src="'"$theme_script_path"'"></script>' "$file"
    else
        sed -i '/<head>/a\  <meta charset="UTF-8">\n  <!-- CRITICAL: Load theme BEFORE CSS to prevent flash -->\n  <script src="'"$theme_script_path"'"></script>' "$file"
    fi

    # 2. Add theme components before </body> if not already present
    if ! grep -q "pan-theme-provider" "$file"; then
        if has_body_tag "$file"; then
            # Find </body> and add theme components before it
            sed -i 's|</body>|  <pan-theme-provider></pan-theme-provider>\n</body>|' "$file"
        fi
    fi

    echo -e "${GREEN}  ✓ FIXED${NC} $file"
    ((FIXED++))
}

# Find and fix priority pages
echo "Priority 1: Landing & Main Pages"
echo "--------------------------------"

# Landing page
if [ -f "$LARC_ROOT/docs/site/index.html" ]; then
    apply_fix "$LARC_ROOT/docs/site/index.html"
fi

# Original playground
if [ -f "$LARC_ROOT/playground/index.html" ]; then
    apply_fix "$LARC_ROOT/playground/index.html"
fi

# Apps index
if [ -f "$LARC_ROOT/apps/index.html" ]; then
    apply_fix "$LARC_ROOT/apps/index.html"
fi

# Examples index
if [ -f "$LARC_ROOT/examples/index.html" ]; then
    apply_fix "$LARC_ROOT/examples/index.html"
fi

echo ""
echo "Priority 2: App Pages"
echo "--------------------"

# All app pages
for app_file in "$LARC_ROOT"/apps/*/index.html; do
    if [ -f "$app_file" ]; then
        apply_fix "$app_file"
    fi
done

echo ""
echo "Priority 3: Example Tutorial Pages"
echo "-----------------------------------"

# Tutorial examples
for example_file in "$LARC_ROOT"/examples/tutorials/*.html; do
    if [ -f "$example_file" ]; then
        apply_fix "$example_file"
    fi
done

echo ""
echo "================================="
echo -e "${GREEN}✓ Fixed:${NC} $FIXED files"
echo -e "${YELLOW}⊘ Skipped:${NC} $SKIPPED files"
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}✗ Errors:${NC} $ERRORS files"
fi
echo ""

# Cleanup backups if successful
if [ $ERRORS -eq 0 ]; then
    echo "Cleaning up backups..."
    find "$LARC_ROOT" -name "*.html.bak" -type f -delete 2>/dev/null || true
    echo -e "${GREEN}Done!${NC}"
else
    echo -e "${YELLOW}Warning: Errors occurred. Backup files (.bak) were kept.${NC}"
fi
