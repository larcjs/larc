#!/bin/bash

################################################################################
# Learning LARC - Book Build Script
#
# Converts markdown files to HTML, PDF, and EPUB formats
# Features: Cover images (front & back), diagrams, responsive HTML
#
# Requirements:
#   - pandoc (brew install pandoc)
#   - pdflatex (brew install --cask mactex-no-gui)
#   - prince (optional, for better PDF: https://www.princexml.com/)
#   - mermaid-cli (npm install -g @mermaid-js/mermaid-cli)
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
IMAGES_DIR="${BUILD_DIR}/images"
TEMP_DIR="${BUILD_DIR}/temp"

# Book metadata
BOOK_TITLE="Learning LARC"
BOOK_SUBTITLE="A Hands-On Guide to Modern Web Development"
AUTHOR="Christopher Robison"
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
        echo -e "${RED}Missing required dependencies:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "  - ${dep}"
        done
        echo ""
        echo "Install with:"
        echo "  brew install pandoc"
        echo "  brew install --cask mactex-no-gui"
        exit 1
    fi

    # Check optional dependencies
    if ! command -v mmdc &> /dev/null; then
        echo -e "${YELLOW}⚠️  Mermaid CLI not found (diagrams will be skipped)${NC}"
        echo -e "${YELLOW}   Install: npm install -g @mermaid-js/mermaid-cli${NC}"
    fi

    echo -e "${GREEN}✓ Required dependencies installed${NC}"
}

# Create build directories
setup_directories() {
    echo -e "${BLUE}Setting up build directories...${NC}"
    mkdir -p "${BUILD_DIR}"
    mkdir -p "${OUTPUT_DIR}/html"
    mkdir -p "${OUTPUT_DIR}/pdf"
    mkdir -p "${OUTPUT_DIR}/epub"
    mkdir -p "${OUTPUT_DIR}/docx"
    mkdir -p "${IMAGES_DIR}"
    mkdir -p "${TEMP_DIR}"
    mkdir -p "${OUTPUT_DIR}/html/images"
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
rights: © $(date +%Y) ${AUTHOR}
description: |
  A comprehensive, hands-on guide to building modern web applications
  with LARC. Learn to create reactive components using web standards
  and the Page Area Network (PAN) message bus.
---
EOF
    echo -e "${GREEN}✓ Metadata created${NC}"
}

# Convert Mermaid diagrams to images
convert_diagrams() {
    if ! command -v mmdc &> /dev/null; then
        echo -e "${YELLOW}Skipping diagram conversion (mermaid-cli not installed)${NC}"
        return
    fi

    echo -e "${BLUE}Converting Mermaid diagrams to images...${NC}"

    local diagram_files=(
        "diagrams/01-architecture-overview.md"
        "diagrams/02-component-structure.md"
        "diagrams/05-pan-bus.md"
        "diagrams/06-state-management.md"
        "diagrams/08-routing.md"
        "diagrams/12-traditional-vs-larc.md"
        "diagrams/14-app-architecture.md"
    )

    local converted=0
    for diagram_file in "${diagram_files[@]}"; do
        if [ -f "${BOOK_DIR}/$diagram_file" ]; then
            local base_name=$(basename "$diagram_file" .md)
            echo -e "  Converting ${base_name}..."
            # mmdc may return non-zero even on success with multiple diagrams, so ignore exit code
            mmdc -i "${BOOK_DIR}/$diagram_file" -o "${IMAGES_DIR}/${base_name}.png" -w 1200 -b transparent 2>&1 || true
            # Check if any files were actually created
            if ls "${IMAGES_DIR}/${base_name}"*.png 1>/dev/null 2>&1; then
                converted=$((converted + 1))
            else
                echo -e "${YELLOW}  ⚠️  No output for ${base_name}${NC}"
            fi
        fi
    done

    if [ $converted -gt 0 ]; then
        echo -e "${GREEN}✓ Converted $converted diagram(s)${NC}"
    fi
}

# Create book order file (concatenate all chapters in order)
create_combined_markdown() {
    echo -e "${BLUE}Combining chapters...${NC}"

    local COMBINED_MD="${TEMP_DIR}/learning-larc-complete.md"

    # Start with front matter
    if [ -f "${BOOK_DIR}/00-front-matter.md" ]; then
        cat "${BOOK_DIR}/00-front-matter.md" > "$COMBINED_MD"
        echo "" >> "$COMBINED_MD"
        echo "\\pagebreak" >> "$COMBINED_MD"
        echo "" >> "$COMBINED_MD"
    fi

    # Add foreword
    if [ -f "${BOOK_DIR}/foreword.md" ]; then
        cat "${BOOK_DIR}/foreword.md" >> "$COMBINED_MD"
        echo "" >> "$COMBINED_MD"
        echo "\\pagebreak" >> "$COMBINED_MD"
        echo "" >> "$COMBINED_MD"
    fi

    # Add all chapters in order
    local chapters=(
        "chapters/01-philosophy-and-background.md"
        "chapters/02-core-concepts.md"
        "chapters/03-getting-started.md"
        "chapters/04-creating-web-components.md"
        "chapters/05-the-pan-bus.md"
        "chapters/06-state-management.md"
        "chapters/07-advanced-component-patterns.md"
        "chapters/08-business-logic-patterns.md"
        "chapters/09-routing-and-navigation.md"
        "chapters/10-forms-and-validation.md"
        "chapters/11-19-summary.md"
    )

    for chapter in "${chapters[@]}"; do
        if [ -f "${BOOK_DIR}/$chapter" ]; then
            echo -e "  Adding $(basename "$chapter")..."
            cat "${BOOK_DIR}/$chapter" >> "$COMBINED_MD"
            echo "" >> "$COMBINED_MD"
            echo "\\pagebreak" >> "$COMBINED_MD"
            echo "" >> "$COMBINED_MD"
        fi
    done

    # Add author bio if exists
    if [ -f "${BOOK_DIR}/author-bio.md" ]; then
        cat "${BOOK_DIR}/author-bio.md" >> "$COMBINED_MD"
        echo "" >> "$COMBINED_MD"
        echo "\\pagebreak" >> "$COMBINED_MD"
        echo "" >> "$COMBINED_MD"
    fi

    # Add back cover content if exists
    if [ -f "${BOOK_DIR}/back-cover.md" ]; then
        cat "${BOOK_DIR}/back-cover.md" >> "$COMBINED_MD"
    fi

    # Copy images to output
    if [ -d "${IMAGES_DIR}" ]; then
        cp -r "${IMAGES_DIR}"/* "${OUTPUT_DIR}/html/images/" 2>/dev/null || true
    fi

    # Fix image paths in combined markdown
    # The chapters reference ../images/ but we need to point to the actual build/images/ location
    echo -e "${BLUE}Fixing image paths...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS sed requires empty string for -i
        sed -i '' "s|\.\./images/|${IMAGES_DIR}/|g" "$COMBINED_MD"
    else
        # Linux sed
        sed -i "s|\.\./images/|${IMAGES_DIR}/|g" "$COMBINED_MD"
    fi

    # Clean up duplicate images and caption lines
    echo -e "${BLUE}Cleaning up image formatting...${NC}"

    # Create a Python script to clean up the markdown
    cat > "${TEMP_DIR}/clean_images.py" << 'PYSCRIPT'
import re
import sys

with open(sys.argv[1], 'r') as f:
    content = f.read()

# Remove standalone italic caption lines that duplicate image alt text
# Pattern: ***Figure X.X:** Description* (with or without leading asterisks)
content = re.sub(r'\n\*{2,3}Figure [0-9]+\.[0-9]+:\*?\*? [^\n]+\*\n', '\n', content)
content = re.sub(r'\n\*\*\*Figure [0-9]+\.[0-9]+:\*\* [^\n]+\*\n', '\n', content)

# Remove duplicate consecutive images (same image appearing twice in a row)
lines = content.split('\n')
cleaned_lines = []
prev_image = None
for line in lines:
    # Check if this is an image line
    img_match = re.match(r'!\[.*?\]\((.*?)\)', line)
    if img_match:
        current_image = img_match.group(1)
        if current_image != prev_image:
            cleaned_lines.append(line)
            prev_image = current_image
        # Skip duplicate
    else:
        cleaned_lines.append(line)
        if line.strip():  # Reset prev_image for non-empty, non-image lines
            prev_image = None

content = '\n'.join(cleaned_lines)

# Remove multiple consecutive blank lines (more than 2)
content = re.sub(r'\n{4,}', '\n\n\n', content)

with open(sys.argv[1], 'w') as f:
    f.write(content)
PYSCRIPT

    python3 "${TEMP_DIR}/clean_images.py" "$COMBINED_MD"
    rm "${TEMP_DIR}/clean_images.py"

    echo -e "${GREEN}✓ Chapters combined${NC}"
}

# Create EPUB metadata
create_epub_metadata() {
    cat > "${BUILD_DIR}/epub-metadata.xml" <<EOF
<dc:rights>© $(date +%Y) ${AUTHOR}</dc:rights>
<dc:language>en-US</dc:language>
<dc:publisher>LARC Project</dc:publisher>
<dc:subject>Web Development</dc:subject>
<dc:subject>JavaScript</dc:subject>
<dc:subject>Web Components</dc:subject>
<dc:subject>Tutorial</dc:subject>
<dc:description>A hands-on guide to building modern web applications with LARC.</dc:description>
EOF
}

# Create CSS for HTML/PDF
create_default_css() {
    echo -e "${BLUE}Creating CSS styles...${NC}"

    cat > "${TEMP_DIR}/book-style.css" <<'EOF'
/* Learning LARC - Book Styles */

:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --text-color: #2d3748;
  --bg-color: #ffffff;
  --code-bg: #f7fafc;
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
}

h1 {
  font-size: 2.5rem;
  color: var(--primary-color);
  border-bottom: 3px solid var(--primary-color);
  padding-bottom: 0.5rem;
}

h2 {
  font-size: 2rem;
  color: var(--secondary-color);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
}

h3 {
  font-size: 1.5rem;
}

h4 {
  font-size: 1.25rem;
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
  border-left: 4px solid var(--primary-color);
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

img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 1rem 0;
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

    echo -e "${GREEN}✓ CSS styles created${NC}"
}

# Generate HTML version
build_html() {
    echo -e "${BLUE}Building HTML version...${NC}"

    create_default_css

    pandoc \
        "${BUILD_DIR}/metadata.yaml" \
        "${TEMP_DIR}/learning-larc-complete.md" \
        --from markdown+smart \
        --to html5 \
        --standalone \
        --toc \
        --toc-depth=3 \
        --number-sections \
        --css="book-style.css" \
        --highlight-style=tango \
        --metadata title="${BOOK_TITLE}" \
        --resource-path="${BOOK_DIR}:${BUILD_DIR}" \
        --output="${OUTPUT_DIR}/html/learning-larc.html"

    # Copy CSS to output
    cp "${TEMP_DIR}/book-style.css" "${OUTPUT_DIR}/html/"

    # Fix image paths if needed
    sed -i '' 's|src="../images/|src="images/|g' "${OUTPUT_DIR}/html/learning-larc.html" 2>/dev/null || true

    echo -e "${GREEN}✓ HTML version complete: ${OUTPUT_DIR}/html/learning-larc.html${NC}"
}

# Generate PDF version
build_pdf() {
    echo -e "${BLUE}Building PDF version...${NC}"

    # Check if Prince XML is available
    if command -v prince &> /dev/null; then
        echo -e "${YELLOW}Using Prince XML for PDF generation...${NC}"

        # Create cover page HTML if cover image exists
        if [ -f "${BOOK_DIR}/learning-larc-cover.png" ]; then
            echo -e "${YELLOW}Adding front cover...${NC}"
            cat > "${TEMP_DIR}/cover.html" <<COVEREOF
<!DOCTYPE html>
<html>
<head>
    <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; }
        .cover-page {
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-after: always;
        }
        .cover-page img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    </style>
</head>
<body>
    <div class="cover-page">
        <img src="${BOOK_DIR}/learning-larc-cover.png" alt="Book Cover" />
    </div>
</body>
</html>
COVEREOF
            COVER_FILE="${TEMP_DIR}/cover.html"
        else
            echo -e "${YELLOW}No front cover image found, skipping...${NC}"
            COVER_FILE=""
        fi

        # Generate main content HTML
        pandoc \
            "${BUILD_DIR}/metadata.yaml" \
            "${TEMP_DIR}/learning-larc-complete.md" \
            --from markdown+smart \
            --to html5 \
            --standalone \
            --toc \
            --toc-depth=3 \
            --number-sections \
            --css="${TEMP_DIR}/book-style.css" \
            --highlight-style=tango \
            --output="${TEMP_DIR}/temp.html"

        # Convert HTML to PDF with Prince (include cover if it exists)
        if [ -n "$COVER_FILE" ]; then
            prince \
                "${COVER_FILE}" \
                "${TEMP_DIR}/temp.html" \
                -o "${OUTPUT_DIR}/pdf/learning-larc.pdf" \
                --pdf-title="${BOOK_TITLE}" \
                --pdf-author="${AUTHOR}"
        else
            prince \
                "${TEMP_DIR}/temp.html" \
                -o "${OUTPUT_DIR}/pdf/learning-larc.pdf" \
                --pdf-title="${BOOK_TITLE}" \
                --pdf-author="${AUTHOR}"
        fi

        # Cleanup
        rm "${TEMP_DIR}/temp.html"
        [ -f "${TEMP_DIR}/cover.html" ] && rm "${TEMP_DIR}/cover.html"
    else
        echo -e "${YELLOW}Using XeLaTeX for PDF generation (Unicode support)...${NC}"

        pandoc \
            "${BUILD_DIR}/metadata.yaml" \
            "${TEMP_DIR}/learning-larc-complete.md" \
            --from markdown+smart \
            --to pdf \
            --pdf-engine=xelatex \
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
            --resource-path="${BOOK_DIR}:${BUILD_DIR}" \
            --output="${OUTPUT_DIR}/pdf/learning-larc.pdf"
    fi

    echo -e "${GREEN}✓ PDF version complete: ${OUTPUT_DIR}/pdf/learning-larc.pdf${NC}"
}

# Generate EPUB version
build_epub() {
    echo -e "${BLUE}Building EPUB version...${NC}"

    # Check for cover image
    if [ -f "${BOOK_DIR}/learning-larc-cover.png" ]; then
        COVER_ARG="--epub-cover-image=${BOOK_DIR}/learning-larc-cover.png"
        echo -e "${GREEN}Using cover image: learning-larc-cover.png${NC}"
    elif [ -f "${BOOK_DIR}/larc-book.png" ]; then
        COVER_ARG="--epub-cover-image=${BOOK_DIR}/larc-book.png"
        echo -e "${GREEN}Using cover image: larc-book.png${NC}"
    elif [ -f "${BOOK_DIR}/cover.png" ]; then
        COVER_ARG="--epub-cover-image=${BOOK_DIR}/cover.png"
        echo -e "${GREEN}Using cover image: cover.png${NC}"
    else
        COVER_ARG=""
        echo -e "${YELLOW}No cover image found${NC}"
    fi

    pandoc \
        "${BUILD_DIR}/metadata.yaml" \
        "${TEMP_DIR}/learning-larc-complete.md" \
        --from markdown+smart \
        --to epub3 \
        --toc \
        --toc-depth=3 \
        --number-sections \
        --highlight-style=tango \
        --epub-metadata="${BUILD_DIR}/epub-metadata.xml" \
        ${COVER_ARG} \
        --resource-path="${BOOK_DIR}:${BUILD_DIR}" \
        --output="${OUTPUT_DIR}/epub/learning-larc.epub"

    echo -e "${GREEN}✓ EPUB version complete: ${OUTPUT_DIR}/epub/learning-larc.epub${NC}"
}

# Generate DOCX version (for Kindle Create)
build_docx() {
    echo -e "${BLUE}Building DOCX version for Kindle Create...${NC}"

    # Create reference docx for styling if it doesn't exist
    if [ ! -f "${BUILD_DIR}/kindle-reference.docx" ]; then
        create_kindle_reference_docx
    fi

    # Create a Lua filter for chapter page breaks and code block styling
    cat > "${TEMP_DIR}/figure-filter.lua" << 'LUAFILTER'
-- Lua filter for DOCX formatting

-- Add page break before level 1 headings (chapters)
function Header(el)
    if el.level == 1 then
        return {
            pandoc.RawBlock('openxml', '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'),
            el
        }
    end
    return el
end

-- Handle figures - wrap standalone images in a figure with caption
function Para(el)
    if #el.content == 1 and el.content[1].t == "Image" then
        local img = el.content[1]
        local caption = pandoc.utils.stringify(img.caption)

        if caption and caption ~= "" then
            return pandoc.Div({
                pandoc.Para({img}),
                pandoc.Para({pandoc.Emph({pandoc.Str(caption)})})
            }, {class = "figure"})
        end
    end
    return el
end

-- Style code blocks with grey background and border
function CodeBlock(el)
    -- Wrap code block with OpenXML shading
    local code_text = el.text
    local lines = {}
    for line in code_text:gmatch("([^\n]*)\n?") do
        if line ~= "" or #lines > 0 then
            table.insert(lines, line)
        end
    end
    -- Remove trailing empty line if exists
    if #lines > 0 and lines[#lines] == "" then
        table.remove(lines)
    end

    -- Create paragraphs for each line with shading
    local blocks = {}

    -- Add top border/spacing
    table.insert(blocks, pandoc.RawBlock('openxml',
        '<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F5F5F5"/><w:spacing w:before="120" w:after="0"/><w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="CCCCCC"/><w:left w:val="single" w:sz="4" w:space="4" w:color="CCCCCC"/><w:right w:val="single" w:sz="4" w:space="4" w:color="CCCCCC"/></w:pBdr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' ..
        (lines[1] or '') .. '</w:t></w:r></w:p>'))

    -- Add middle lines
    for i = 2, #lines - 1 do
        table.insert(blocks, pandoc.RawBlock('openxml',
            '<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F5F5F5"/><w:spacing w:before="0" w:after="0"/><w:pBdr><w:left w:val="single" w:sz="4" w:space="4" w:color="CCCCCC"/><w:right w:val="single" w:sz="4" w:space="4" w:color="CCCCCC"/></w:pBdr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' ..
            lines[i] .. '</w:t></w:r></w:p>'))
    end

    -- Add bottom line with border
    if #lines > 1 then
        table.insert(blocks, pandoc.RawBlock('openxml',
            '<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F5F5F5"/><w:spacing w:before="0" w:after="120"/><w:pBdr><w:left w:val="single" w:sz="4" w:space="4" w:color="CCCCCC"/><w:right w:val="single" w:sz="4" w:space="4" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="4" w:space="4" w:color="CCCCCC"/></w:pBdr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' ..
            lines[#lines] .. '</w:t></w:r></w:p>'))
    end

    return blocks
end
LUAFILTER

    # Build DOCX with Kindle-friendly settings
    # Note: We don't use --toc here because 00-front-matter.md contains
    # a beautifully formatted manual Table of Contents
    pandoc \
        "${BUILD_DIR}/metadata.yaml" \
        "${TEMP_DIR}/learning-larc-complete.md" \
        --from markdown+smart+implicit_figures \
        --to docx \
        --number-sections \
        --lua-filter="${TEMP_DIR}/figure-filter.lua" \
        --reference-doc="${BUILD_DIR}/kindle-reference.docx" \
        --metadata title="${BOOK_TITLE}" \
        --metadata author="${AUTHOR}" \
        --resource-path="${BOOK_DIR}:${BUILD_DIR}:${IMAGES_DIR}" \
        --output="${OUTPUT_DIR}/docx/learning-larc.docx"

    rm "${TEMP_DIR}/figure-filter.lua"

    echo -e "${GREEN}✓ DOCX version complete: ${OUTPUT_DIR}/docx/learning-larc.docx${NC}"
    echo -e "${YELLOW}  Import this file into Kindle Create to publish on Amazon KDP${NC}"
}

# Create reference DOCX template for Kindle-friendly formatting
create_kindle_reference_docx() {
    echo -e "${BLUE}Creating Kindle-optimized DOCX reference template...${NC}"

    # Create a minimal markdown file to generate reference docx
    cat > "${TEMP_DIR}/temp-reference.md" <<'REFEOF'
---
title: Reference
---

# Heading 1

## Heading 2

### Heading 3

Normal paragraph text.

**Bold text** and *italic text*.

> Blockquote

```
Code block
```

`inline code`
REFEOF

    # Generate base reference docx
    pandoc \
        "${TEMP_DIR}/temp-reference.md" \
        --from markdown \
        --to docx \
        --output="${BUILD_DIR}/kindle-reference.docx"

    # Clean up temp file
    rm "${TEMP_DIR}/temp-reference.md"

    echo -e "${GREEN}✓ Reference template created${NC}"
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
    convert_diagrams
    create_combined_markdown

    build_html
    build_pdf
    build_epub
    build_docx

    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Book build complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Output files:"
    echo -e "  ${BLUE}HTML:${NC} ${OUTPUT_DIR}/html/learning-larc.html"
    echo -e "  ${BLUE}PDF:${NC}  ${OUTPUT_DIR}/pdf/learning-larc.pdf"
    echo -e "  ${BLUE}EPUB:${NC} ${OUTPUT_DIR}/epub/learning-larc.epub"
    echo -e "  ${BLUE}DOCX:${NC} ${OUTPUT_DIR}/docx/learning-larc.docx (for Kindle Create)"
    echo ""
    echo "View HTML: open ${OUTPUT_DIR}/html/learning-larc.html"
    echo "View PDF:  open ${OUTPUT_DIR}/pdf/learning-larc.pdf"
    echo "View DOCX: open ${OUTPUT_DIR}/docx/learning-larc.docx"
    echo ""

    # Show file sizes
    echo "File sizes:"
    du -h "${OUTPUT_DIR}"/html/*.html "${OUTPUT_DIR}"/pdf/*.pdf "${OUTPUT_DIR}"/epub/*.epub "${OUTPUT_DIR}"/docx/*.docx 2>/dev/null || true
    echo ""
}

# Main script logic
main() {
    local format="${1:-all}"

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Learning LARC: Book Builder${NC}"
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
            convert_diagrams
            create_combined_markdown
            build_html
            ;;
        pdf)
            check_dependencies
            setup_directories
            create_metadata
            convert_diagrams
            create_combined_markdown
            build_pdf
            ;;
        epub)
            check_dependencies
            setup_directories
            create_metadata
            create_epub_metadata
            convert_diagrams
            create_combined_markdown
            build_epub
            ;;
        docx|kindle)
            check_dependencies
            setup_directories
            create_metadata
            convert_diagrams
            create_combined_markdown
            build_docx
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
            echo "  all    - Build HTML, PDF, EPUB, and DOCX (default)"
            echo "  html   - Build HTML only"
            echo "  pdf    - Build PDF only"
            echo "  epub   - Build EPUB only"
            echo "  docx   - Build DOCX only (for Kindle Create)"
            echo "  kindle - Alias for docx"
            echo "  clean  - Remove build artifacts"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
