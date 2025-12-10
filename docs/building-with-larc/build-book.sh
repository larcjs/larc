#!/bin/bash

################################################################################
# Building with LARC - Book Build Script
#
# Converts markdown files to HTML, PDF, and EPUB formats
#
# Requirements:
#   - pandoc (brew install pandoc)
#   - pdflatex (brew install --cask mactex-no-gui)
#   - prince (optional, for better PDF: https://www.princexml.com/)
#
# Usage:
#   ./build-book.sh [format]
#
#   format: all (default), html, pdf, epub, clean
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
BOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${BOOK_DIR}/build"
OUTPUT_DIR="${BOOK_DIR}/output"

# Book metadata
BOOK_TITLE="Building with LARC: A Reference Manual"
BOOK_SUBTITLE="A Comprehensive Guide to Modern Web Applications"
AUTHOR="LARC Project Contributors"
VERSION="1.0.0"
DATE=$(date +"%B %Y")

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"

    local missing_deps=()

    if ! command -v pandoc &> /dev/null; then
        missing_deps+=("pandoc")
    fi

    if ! command -v pdflatex &> /dev/null; then
        missing_deps+=("pdflatex (MacTeX)")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}Missing dependencies:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "  - ${dep}"
        done
        echo ""
        echo "Install with:"
        echo "  brew install pandoc"
        echo "  brew install --cask mactex-no-gui"
        exit 1
    fi

    echo -e "${GREEN}✓ All dependencies installed${NC}"
}

# Create build directories
setup_directories() {
    echo -e "${BLUE}Setting up build directories...${NC}"
    mkdir -p "${BUILD_DIR}"
    mkdir -p "${OUTPUT_DIR}/html"
    mkdir -p "${OUTPUT_DIR}/pdf"
    mkdir -p "${OUTPUT_DIR}/epub"
    echo -e "${GREEN}✓ Directories ready${NC}"
}

# Create metadata file for Pandoc
create_metadata() {
    echo -e "${BLUE}Creating metadata...${NC}"
    cat > "${BUILD_DIR}/metadata.yaml" <<EOF
---
title: "${BOOK_TITLE}"
subtitle: "${BOOK_SUBTITLE}"
author: "${AUTHOR}"
date: "${DATE}"
version: "${VERSION}"
lang: en-US
rights: © $(date +%Y) LARC Project
description: |
  A comprehensive reference manual for building modern web applications
  with LARC (Lightweight Async Reactive Components). This book covers
  philosophy, practical implementation, complete API reference, and
  quick-reference appendices.
---
EOF
    echo -e "${GREEN}✓ Metadata created${NC}"
}

# Create book order file (concatenate all chapters in order)
create_book_order() {
    echo -e "${BLUE}Creating book content order...${NC}"

    # Create ordered list of files
    cat > "${BUILD_DIR}/book-order.txt" <<EOF
chapter-01-introduction.md
chapter-02-philosophy.md
chapter-03-story.md
chapter-04-core-concepts.md
chapter-05-getting-started.md
chapter-06-basic-message-flow.md
chapter-07-working-with-components.md
chapter-08-state-management.md
chapter-09-routing-and-navigation.md
chapter-10-forms-and-user-input.md
chapter-11-data-fetching-and-apis.md
chapter-12-authentication-and-authorization.md
chapter-13-realtime-features.md
chapter-14-file-management.md
chapter-15-theming-and-styling.md
chapter-16-performance-optimization.md
chapter-17-testing-strategies.md
chapter-18-error-handling-and-debugging.md
chapter-19-advanced-patterns.md
chapter-20-deployment-and-production.md
chapter-21-core-components.md
chapter-22-data-components.md
chapter-23-ui-components.md
chapter-24-integration-components.md
chapter-25-utility-components.md
appendix-a-message-topics.md
appendix-b-event-envelope.md
appendix-c-configuration-options.md
appendix-d-migration-guide.md
appendix-e-recipes-and-patterns.md
appendix-f-glossary.md
appendix-g-resources.md
index.md
colophon.md
back-cover.md
EOF

    echo -e "${GREEN}✓ Book order created${NC}"
}

# Generate HTML version
build_html() {
    echo -e "${BLUE}Building HTML version...${NC}"

    # Create single-page HTML
    pandoc \
        "${BUILD_DIR}/metadata.yaml" \
        $(cat "${BUILD_DIR}/book-order.txt" | sed "s|^|${BOOK_DIR}/|") \
        --from markdown+smart \
        --to html5 \
        --standalone \
        --toc \
        --toc-depth=3 \
        --number-sections \
        --css="${BOOK_DIR}/book-style.css" \
        --highlight-style=tango \
        --metadata title="${BOOK_TITLE}" \
        --output="${OUTPUT_DIR}/html/building-with-larc.html"

    # Copy CSS file if it doesn't exist, create a default one
    if [ ! -f "${BOOK_DIR}/book-style.css" ]; then
        create_default_css
    fi
    cp "${BOOK_DIR}/book-style.css" "${OUTPUT_DIR}/html/"

    echo -e "${GREEN}✓ HTML version complete: ${OUTPUT_DIR}/html/building-with-larc.html${NC}"
}

# Generate PDF version
build_pdf() {
    echo -e "${BLUE}Building PDF version...${NC}"

    # Check if Prince XML is available (better PDF output)
    if command -v prince &> /dev/null; then
        echo -e "${YELLOW}Using Prince XML for PDF generation...${NC}"

        # First generate HTML
        pandoc \
            "${BUILD_DIR}/metadata.yaml" \
            $(cat "${BUILD_DIR}/book-order.txt" | sed "s|^|${BOOK_DIR}/|") \
            --from markdown+smart \
            --to html5 \
            --standalone \
            --toc \
            --toc-depth=3 \
            --number-sections \
            --css="${BOOK_DIR}/book-style-print.css" \
            --highlight-style=tango \
            --output="${BUILD_DIR}/temp.html"

        # Convert HTML to PDF with Prince
        prince \
            "${BUILD_DIR}/temp.html" \
            -o "${OUTPUT_DIR}/pdf/building-with-larc.pdf" \
            --pdf-title="${BOOK_TITLE}" \
            --pdf-author="${AUTHOR}"

        rm "${BUILD_DIR}/temp.html"
    else
        echo -e "${YELLOW}Using pdflatex for PDF generation...${NC}"

        pandoc \
            "${BUILD_DIR}/metadata.yaml" \
            $(cat "${BUILD_DIR}/book-order.txt" | sed "s|^|${BOOK_DIR}/|") \
            --from markdown+smart \
            --to pdf \
            --pdf-engine=pdflatex \
            --toc \
            --toc-depth=3 \
            --number-sections \
            --highlight-style=tango \
            --variable documentclass=book \
            --variable papersize=letter \
            --variable fontsize=11pt \
            --variable geometry:margin=1in \
            --variable linkcolor=blue \
            --variable urlcolor=blue \
            --variable toccolor=black \
            --output="${OUTPUT_DIR}/pdf/building-with-larc.pdf"
    fi

    echo -e "${GREEN}✓ PDF version complete: ${OUTPUT_DIR}/pdf/building-with-larc.pdf${NC}"
}

# Generate EPUB version
build_epub() {
    echo -e "${BLUE}Building EPUB version...${NC}"

    # Create cover page if it doesn't exist
    if [ ! -f "${BOOK_DIR}/front-cover.png" ]; then
        echo -e "${YELLOW}No cover image found (front-cover.png), skipping cover...${NC}"
        COVER_ARG=""
    else
        COVER_ARG="--epub-cover-image=${BOOK_DIR}/front-cover.png"
    fi

    pandoc \
        "${BUILD_DIR}/metadata.yaml" \
        $(cat "${BUILD_DIR}/book-order.txt" | sed "s|^|${BOOK_DIR}/|") \
        --from markdown+smart \
        --to epub3 \
        --toc \
        --toc-depth=3 \
        --number-sections \
        --highlight-style=tango \
        --epub-metadata="${BUILD_DIR}/epub-metadata.xml" \
        ${COVER_ARG} \
        --output="${OUTPUT_DIR}/epub/building-with-larc.epub"

    echo -e "${GREEN}✓ EPUB version complete: ${OUTPUT_DIR}/epub/building-with-larc.epub${NC}"
}

# Create EPUB metadata
create_epub_metadata() {
    cat > "${BUILD_DIR}/epub-metadata.xml" <<EOF
<dc:rights>© $(date +%Y) LARC Project</dc:rights>
<dc:language>en-US</dc:language>
<dc:publisher>LARC Project</dc:publisher>
<dc:subject>Web Development</dc:subject>
<dc:subject>JavaScript</dc:subject>
<dc:subject>Web Components</dc:subject>
<dc:subject>Message Bus</dc:subject>
<dc:description>A comprehensive reference manual for building modern web applications with LARC.</dc:description>
EOF
}

# Create default CSS for HTML/PDF
create_default_css() {
    echo -e "${BLUE}Creating default CSS...${NC}"

    cat > "${BOOK_DIR}/book-style.css" <<'EOF'
/* Building with LARC - Book Styles */

:root {
  --primary-color: #006699;
  --secondary-color: #06b6d4;
  --text-color: #1e293b;
  --bg-color: #ffffff;
  --code-bg: #f8fafc;
  --border-color: #e2e8f0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--bg-color);
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

h1 {
  font-size: 2.5rem;
  border-bottom: 3px solid var(--primary-color);
  padding-bottom: 0.5rem;
}

h2 {
  font-size: 2rem;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
}

h3 {
  font-size: 1.5rem;
}

h4 {
  font-size: 1.25rem;
  color: var(--text-color);
}

code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  background: var(--code-bg);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  border: 1px solid var(--border-color);
}

pre {
  background: var(--code-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin: 1rem 0;
}

pre code {
  background: none;
  border: none;
  padding: 0;
}

blockquote {
  border-left: 4px solid var(--secondary-color);
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  background: var(--code-bg);
  font-style: italic;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

th, td {
  border: 1px solid var(--border-color);
  padding: 0.75rem;
  text-align: left;
}

th {
  background: var(--code-bg);
  font-weight: 600;
}

tr:nth-child(even) {
  background: var(--code-bg);
}

a {
  color: var(--primary-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

#TOC {
  background: var(--code-bg);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
}

#TOC ul {
  list-style: none;
  padding-left: 1rem;
}

#TOC > ul {
  padding-left: 0;
}

#TOC a {
  color: var(--text-color);
}

#TOC a:hover {
  color: var(--primary-color);
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  border-radius: 8px;
}

.header h1 {
  color: white;
  border: none;
  margin: 0;
}

.header .subtitle {
  font-size: 1.25rem;
  margin-top: 0.5rem;
  opacity: 0.9;
}

.header .meta {
  margin-top: 1rem;
  font-size: 0.9rem;
  opacity: 0.8;
}

@media print {
  body {
    max-width: 100%;
    padding: 0;
  }

  a {
    color: var(--text-color);
  }

  pre {
    page-break-inside: avoid;
  }

  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }
}
EOF

    # Create print-specific CSS
    cat > "${BOOK_DIR}/book-style-print.css" <<'EOF'
/* Building with LARC - Print Styles */
@import url('book-style.css');

@page {
  size: letter;
  margin: 1in;

  @top-left {
    content: string(chapter);
  }

  @top-right {
    content: counter(page);
  }
}

h1 {
  page-break-before: always;
  string-set: chapter content();
}

h2, h3, h4, h5, h6 {
  page-break-after: avoid;
}

pre, table, figure {
  page-break-inside: avoid;
}

a {
  color: black;
  text-decoration: none;
}

a[href^="http"]:after {
  content: " (" attr(href) ")";
  font-size: 0.8em;
}
EOF

    echo -e "${GREEN}✓ Default CSS created${NC}"
}

# Clean build artifacts
clean_build() {
    echo -e "${BLUE}Cleaning build artifacts...${NC}"
    rm -rf "${BUILD_DIR}"
    rm -rf "${OUTPUT_DIR}"
    echo -e "${GREEN}✓ Build artifacts cleaned${NC}"
}

# Generate all formats
build_all() {
    check_dependencies
    setup_directories
    create_metadata
    create_epub_metadata
    create_book_order

    build_html
    build_pdf
    build_epub

    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Book build complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Output files:"
    echo -e "  ${BLUE}HTML:${NC} ${OUTPUT_DIR}/html/building-with-larc.html"
    echo -e "  ${BLUE}PDF:${NC}  ${OUTPUT_DIR}/pdf/building-with-larc.pdf"
    echo -e "  ${BLUE}EPUB:${NC} ${OUTPUT_DIR}/epub/building-with-larc.epub"
    echo ""
    echo "View HTML: open ${OUTPUT_DIR}/html/building-with-larc.html"
    echo "View PDF:  open ${OUTPUT_DIR}/pdf/building-with-larc.pdf"
    echo ""
}

# Main script logic
main() {
    local format="${1:-all}"

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Building with LARC: Book Builder${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    case "$format" in
        all)
            build_all
            ;;
        html)
            check_dependencies
            setup_directories
            create_metadata
            create_book_order
            build_html
            ;;
        pdf)
            check_dependencies
            setup_directories
            create_metadata
            create_book_order
            build_pdf
            ;;
        epub)
            check_dependencies
            setup_directories
            create_metadata
            create_epub_metadata
            create_book_order
            build_epub
            ;;
        clean)
            clean_build
            ;;
        *)
            echo -e "${RED}Unknown format: $format${NC}"
            echo ""
            echo "Usage: $0 [format]"
            echo ""
            echo "Available formats:"
            echo "  all   - Build HTML, PDF, and EPUB (default)"
            echo "  html  - Build HTML only"
            echo "  pdf   - Build PDF only"
            echo "  epub  - Build EPUB only"
            echo "  clean - Remove build artifacts"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
