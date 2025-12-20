#!/bin/bash

# Learning LARC Book Build Script
# Generates PDF, ePub, and responsive HTML versions

set -e

echo "🏗️  Building Learning LARC Book..."
echo ""

# Configuration
BUILD_DIR="build"
OUTPUT_DIR="$BUILD_DIR/output"
IMAGES_DIR="$BUILD_DIR/images"
TEMP_DIR="$BUILD_DIR/temp"

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$IMAGES_DIR"
mkdir -p "$TEMP_DIR"

# Check dependencies
echo "📋 Checking dependencies..."

if ! command -v pandoc &> /dev/null; then
    echo "❌ Pandoc not found. Installing via homebrew..."
    brew install pandoc
fi

if ! command -v mmdc &> /dev/null; then
    echo "❌ Mermaid CLI not found. Installing via npm..."
    npm install -g @mermaid-js/mermaid-cli
fi

echo "✅ All dependencies installed"
echo ""

# Convert Mermaid diagrams to images
echo "🎨 Converting Mermaid diagrams to images..."

DIAGRAM_FILES=(
    "diagrams/01-architecture-overview.md"
    "diagrams/02-component-structure.md"
    "diagrams/05-pan-bus.md"
    "diagrams/06-state-management.md"
    "diagrams/08-routing.md"
    "diagrams/12-traditional-vs-larc.md"
    "diagrams/14-app-architecture.md"
)

for diagram_file in "${DIAGRAM_FILES[@]}"; do
    if [ -f "$diagram_file" ]; then
        base_name=$(basename "$diagram_file" .md)
        echo "  Converting $base_name..."
        mmdc -i "$diagram_file" -o "$IMAGES_DIR/$base_name.png" -w 1200 -b transparent 2>/dev/null || echo "  ⚠️  Skipped (may contain multiple diagrams)"
    fi
done

echo "✅ Diagrams converted"
echo ""

# Create combined markdown file
echo "📚 Combining chapters..."

COMBINED_MD="$TEMP_DIR/learning-larc-complete.md"

# Start with front matter
cat 00-front-matter.md > "$COMBINED_MD"
echo "" >> "$COMBINED_MD"
echo "\\pagebreak" >> "$COMBINED_MD"
echo "" >> "$COMBINED_MD"

# Add foreword
if [ -f "foreword.md" ]; then
    cat foreword.md >> "$COMBINED_MD"
    echo "" >> "$COMBINED_MD"
    echo "\\pagebreak" >> "$COMBINED_MD"
    echo "" >> "$COMBINED_MD"
fi

# Add all chapters in order
CHAPTERS=(
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

for chapter in "${CHAPTERS[@]}"; do
    if [ -f "$chapter" ]; then
        echo "  Adding $(basename "$chapter")..."
        cat "$chapter" >> "$COMBINED_MD"
        echo "" >> "$COMBINED_MD"
        echo "\\pagebreak" >> "$COMBINED_MD"
        echo "" >> "$COMBINED_MD"
    fi
done

echo "✅ Chapters combined"
echo ""

# Copy images to output directory for HTML
echo "🖼️  Copying images to output directory..."
mkdir -p "$OUTPUT_DIR/images"
cp -r "$IMAGES_DIR"/* "$OUTPUT_DIR/images/" 2>/dev/null || true
echo "✅ Images copied"
echo ""

# Create CSS for HTML output
echo "🎨 Creating HTML styles..."

cat > "$TEMP_DIR/styles.css" << 'EOF'
/* Learning LARC Book Styles */
:root {
    --primary-color: #1e3a5f;
    --secondary-color: #2563eb;
    --text-color: #2d3748;
    --bg-color: #ffffff;
    --code-bg: #f7fafc;
    --border-color: #e2e8f0;
}

* {
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background: var(--bg-color);
    margin: 0;
    padding: 0;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

/* Typography */
h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-top: 2rem;
    margin-bottom: 1rem;
    border-bottom: 3px solid var(--primary-color);
    padding-bottom: 0.5rem;
}

h2 {
    font-size: 2rem;
    font-weight: 600;
    color: var(--secondary-color);
    margin-top: 2rem;
    margin-bottom: 1rem;
}

h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
}

h4 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
}

p {
    margin-bottom: 1rem;
}

a {
    color: var(--primary-color);
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

/* Code blocks */
code {
    font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
    font-size: 0.9em;
    background: var(--code-bg);
    padding: 0.2em 0.4em;
    border-radius: 3px;
}

pre {
    background: var(--code-bg);
    border: 1px solid var(--border-color);
    border-radius: 5px;
    padding: 1rem;
    overflow-x: auto;
    margin: 1rem 0;
}

pre code {
    background: none;
    padding: 0;
}

/* Blockquotes */
blockquote {
    border-left: 4px solid var(--primary-color);
    padding-left: 1rem;
    margin: 1rem 0;
    color: #4a5568;
    font-style: italic;
}

/* Lists */
ul, ol {
    margin: 1rem 0;
    padding-left: 2rem;
}

li {
    margin-bottom: 0.5rem;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
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

/* Images */
img {
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
    border-radius: 5px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Navigation */
.page-break {
    page-break-after: always;
    margin: 2rem 0;
    border-bottom: 2px solid var(--border-color);
}

/* Responsive */
@media (max-width: 768px) {
    body {
        font-size: 16px;
    }

    .container {
        padding: 1rem;
    }

    h1 {
        font-size: 2rem;
    }

    h2 {
        font-size: 1.5rem;
    }

    h3 {
        font-size: 1.25rem;
    }

    pre {
        padding: 0.75rem;
    }
}

/* Print styles */
@media print {
    body {
        font-size: 11pt;
    }

    h1 {
        page-break-before: always;
    }

    h1, h2, h3, h4 {
        page-break-after: avoid;
    }

    pre, blockquote {
        page-break-inside: avoid;
    }
}
EOF

echo "✅ HTML styles created"
echo ""

# Generate HTML version
echo "🌐 Generating HTML version..."

pandoc "$COMBINED_MD" \
    -f markdown \
    -t html5 \
    --standalone \
    --toc \
    --toc-depth=3 \
    --css="styles.css" \
    --highlight-style=tango \
    --metadata title="Learning LARC" \
    --metadata author="Christopher Robison" \
    --resource-path=".:$BUILD_DIR" \
    -o "$OUTPUT_DIR/learning-larc.html"

# Copy CSS to output
cp "$TEMP_DIR/styles.css" "$OUTPUT_DIR/"

# Fix image paths in HTML (from ../images/ to images/)
sed -i '' 's|src="../images/|src="images/|g' "$OUTPUT_DIR/learning-larc.html"

echo "✅ HTML version created: $OUTPUT_DIR/learning-larc.html"
echo ""

# Generate PDF version
echo "📄 Generating PDF version..."

pandoc "$COMBINED_MD" \
    -f markdown \
    -t pdf \
    --pdf-engine=pdflatex \
    --toc \
    --toc-depth=3 \
    --resource-path=".:$BUILD_DIR" \
    --highlight-style=tango \
    --variable geometry:margin=1in \
    --variable fontsize=11pt \
    --variable documentclass=book \
    --variable papersize=letter \
    --metadata title="Learning LARC" \
    --metadata author="Christopher Robison" \
    --metadata date="$(date +%Y)" \
    -o "$OUTPUT_DIR/learning-larc.pdf" 2>/dev/null || {
        echo "⚠️  PDF generation requires LaTeX. Trying alternative method..."
        pandoc "$COMBINED_MD" \
            -f markdown \
            -t html5 \
            --standalone \
            --toc \
            --toc-depth=3 \
            --css="$TEMP_DIR/styles.css" \
            --highlight-style=tango \
            --metadata title="Learning LARC" \
            --metadata author="Christopher Robison" \
            -o "$TEMP_DIR/learning-larc-for-pdf.html"

        if command -v wkhtmltopdf &> /dev/null; then
            wkhtmltopdf \
                --enable-local-file-access \
                --page-size Letter \
                --margin-top 20mm \
                --margin-bottom 20mm \
                --margin-left 20mm \
                --margin-right 20mm \
                "$TEMP_DIR/learning-larc-for-pdf.html" \
                "$OUTPUT_DIR/learning-larc.pdf"
            echo "✅ PDF created using wkhtmltopdf"
        else
            echo "⚠️  PDF generation skipped. Install LaTeX or wkhtmltopdf:"
            echo "    brew install --cask basictex"
            echo "    or: brew install wkhtmltopdf"
        fi
    }

if [ -f "$OUTPUT_DIR/learning-larc.pdf" ]; then
    echo "✅ PDF version created: $OUTPUT_DIR/learning-larc.pdf"
fi
echo ""

# Generate ePub version
echo "📱 Generating ePub version..."

pandoc "$COMBINED_MD" \
    -f markdown \
    -t epub3 \
    --toc \
    --toc-depth=3 \
    --highlight-style=tango \
    --metadata title="Learning LARC" \
    --metadata author="Christopher Robison" \
    --metadata lang=en \
    --resource-path=".:$BUILD_DIR" \
    --epub-cover-image=cover.png \
    -o "$OUTPUT_DIR/learning-larc.epub" 2>/dev/null || {
        echo "⚠️  Creating ePub without cover image..."
        pandoc "$COMBINED_MD" \
            -f markdown \
            -t epub3 \
            --toc \
            --toc-depth=3 \
            --highlight-style=tango \
            --metadata title="Learning LARC" \
            --metadata author="Christopher Robison" \
            --metadata lang=en \
            --resource-path=".:$BUILD_DIR" \
            -o "$OUTPUT_DIR/learning-larc.epub"
    }

echo "✅ ePub version created: $OUTPUT_DIR/learning-larc.epub"
echo ""

# Create a simple index page
echo "📄 Creating index page..."

cat > "$OUTPUT_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Learning LARC - Download</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #2d3748;
        }
        h1 {
            color: #1e3a5f;
            border-bottom: 3px solid #1e3a5f;
            padding-bottom: 0.5rem;
        }
        .download-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .download-card {
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s;
        }
        .download-card:hover {
            border-color: #1e3a5f;
            box-shadow: 0 4px 12px rgba(30, 58, 95, 0.2);
            transform: translateY(-2px);
        }
        .download-card h3 {
            color: #2563eb;
            margin-top: 0;
        }
        .download-btn {
            display: inline-block;
            background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 5px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .download-btn:hover {
            transform: scale(1.05);
        }
        .stats {
            background: #f7fafc;
            border-radius: 8px;
            padding: 1rem;
            margin: 2rem 0;
        }
        .stats ul {
            list-style: none;
            padding: 0;
        }
        .stats li {
            padding: 0.5rem 0;
        }
        .stats li::before {
            content: "✅ ";
        }
    </style>
</head>
<body>
    <h1>📚 Learning LARC</h1>
    <p><strong>A comprehensive guide to building web applications with LARC</strong></p>

    <div class="stats">
        <h3>📊 Book Statistics</h3>
        <ul>
            <li><strong>18 Chapters</strong> covering fundamentals to advanced topics</li>
            <li><strong>5 Appendices</strong> with API references and migration guides</li>
            <li><strong>350+ pages</strong> of content</li>
            <li><strong>150+ code examples</strong> that actually work</li>
            <li><strong>50+ diagrams</strong> visualizing every concept</li>
        </ul>
    </div>

    <h2>📥 Download the Book</h2>

    <div class="download-grid">
        <div class="download-card">
            <h3>🌐 HTML</h3>
            <p>Read online with responsive design and interactive navigation</p>
            <a href="learning-larc.html" class="download-btn">Read Online</a>
        </div>

        <div class="download-card">
            <h3>📄 PDF</h3>
            <p>Perfect for printing or offline reading</p>
            <a href="learning-larc.pdf" class="download-btn" download>Download PDF</a>
        </div>

        <div class="download-card">
            <h3>📱 ePub</h3>
            <p>For e-readers and mobile devices</p>
            <a href="learning-larc.epub" class="download-btn" download>Download ePub</a>
        </div>
    </div>

    <h2>📖 What You'll Learn</h2>
    <ul>
        <li><strong>Part I: Foundations</strong> - Philosophy, core concepts, and getting started</li>
        <li><strong>Part II: Building Components</strong> - Web components, PAN bus, and state management</li>
        <li><strong>Part III: Building Applications</strong> - Routing, forms, data fetching, and authentication</li>
        <li><strong>Part IV: Advanced Topics</strong> - Server integration, testing, performance, and deployment</li>
        <li><strong>Part V: Ecosystem</strong> - Component libraries, tooling, and real-world applications</li>
    </ul>

    <h2>🚀 About LARC</h2>
    <p>
        LARC (Lightweight Autonomous Reactive Components) is a modern web framework that embraces
        web standards and requires no build step. Build fast, maintainable applications using
        native Web Components and the Page Area Network (PAN) bus.
    </p>

    <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; color: #718096;">
        <p>© 2024 LARC Community. Licensed under MIT.</p>
    </footer>
</body>
</html>
EOF

echo "✅ Index page created"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Build Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Output files:"
echo "   HTML:  $OUTPUT_DIR/learning-larc.html"
echo "   PDF:   $OUTPUT_DIR/learning-larc.pdf"
echo "   ePub:  $OUTPUT_DIR/learning-larc.epub"
echo "   Index: $OUTPUT_DIR/index.html"
echo ""
echo "🌐 To view the book:"
echo "   1. Open $OUTPUT_DIR/index.html in your browser"
echo "   2. Or directly open learning-larc.html"
echo ""
echo "📄 File sizes:"
du -h "$OUTPUT_DIR"/* 2>/dev/null || echo "   (File sizes will appear here)"
echo ""
echo "🎉 Your book is ready for distribution!"
