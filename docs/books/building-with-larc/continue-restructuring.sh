#!/bin/bash
# Continue restructuring Building with LARC
# Run this script to complete the remaining work

set -e

cd "$(dirname "$0")"

echo "========================================="
echo "Building with LARC - Continue Restructuring"
echo "========================================="
echo

# Check backup exists
if [ ! -d "../backup/building-with-larc-original-20251226" ]; then
    echo "❌ Backup not found! Please create backup first."
    exit 1
fi

echo "✅ Backup found"
echo

# Step 1: Streamline component chapters (17-21) - CRITICAL
echo "STEP 1: Streamline Component Reference Chapters (17-21)"
echo "This is the highest priority - these chapters have 307 code blocks!"
echo
echo "For each component chapter, you need to:"
echo "  1. Keep only 2 code examples per component (1 quick, 1 comprehensive)"
echo "  2. Remove verbose 'When to use' sections"
echo "  3. Convert method docs to table format"
echo "  4. Keep API reference tables"
echo
echo "Target reductions:"
echo "  - Chapter 17: 1,912 lines → ~600 lines (87 → ~20 code blocks)"
echo "  - Chapter 18: 1,467 lines → ~500 lines (46 → ~15 code blocks)"
echo "  - Chapter 19: 1,354 lines → ~600 lines (63 → ~20 code blocks)"
echo "  - Chapter 20: 2,111 lines → ~800 lines (66 → ~25 code blocks)"
echo "  - Chapter 21: 1,392 lines → ~500 lines (45 → ~20 code blocks)"
echo
echo "Manual editing required. See RESTRUCTURING_STATUS.md for component format template."
read -p "Press Enter when component chapters are streamlined..."

# Step 2: Slim middle chapters (4-16) if needed
echo
echo "STEP 2: Slim Task-Specific Chapters (4-16)"
echo "These chapters need conversion from tutorial → reference style"
echo
echo "For each chapter (4-16):"
echo "  1. Remove 'how-to' tutorials → add 'See Learning LARC Ch X'"
echo "  2. Keep only: config tables, pattern summaries, 1 quick example"
echo "  3. Add cross-references to component chapters"
echo "  4. Target: 300-400 lines per chapter (70% reduction)"
echo
echo "These are lower priority than component chapters."
read -p "Press Enter when middle chapters are slimmed..."

# Step 3: Update build system
echo
echo "STEP 3: Update Build System and Verify"
echo "Updating index and rebuilding PDF..."

# Update index.md with new structure (if exists)
if [ -f "index.md" ]; then
    echo "  → index.md found, please update manually if needed"
fi

# Rebuild PDF
echo "  → Rebuilding PDF..."
if [ -f "Makefile" ]; then
    make clean
    make pdf
elif [ -f "build-book.sh" ]; then
    ./build-book.sh
else
    echo "  ⚠️  No build script found. Run your build manually."
fi

# Check page count
if [ -f "output/pdf/building-with-larc.pdf" ]; then
    echo
    echo "  → Checking page count..."
    if command -v pdfinfo &> /dev/null; then
        pages=$(pdfinfo output/pdf/building-with-larc.pdf | grep Pages | awk '{print $2}')
        echo
        echo "================================"
        echo "RESULT: $pages pages"
        echo "TARGET: 550-650 pages"
        echo "ORIGINAL: 1,376 pages"
        if [ "$pages" -le 650 ]; then
            echo "✅ SUCCESS! Target achieved."
        else
            echo "⚠️  Still over target. Consider further trimming."
        fi
        echo "================================"
    else
        echo "  ⚠️  pdfinfo not available. Check page count manually."
    fi
else
    echo "  ⚠️  PDF not found. Build may have failed."
fi

echo
echo "Done! Check RESTRUCTURING_STATUS.md for details."
echo "Backup location: ../backup/building-with-larc-original-20251226/"
