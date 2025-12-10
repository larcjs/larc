# Building the Book

This directory contains the complete "Building with LARC: A Reference Manual" and tools to generate the book in multiple formats.

## Quick Start

```bash
# Install dependencies (first time only)
brew install pandoc
brew install --cask mactex-no-gui

# Build all formats (HTML, PDF, EPUB)
./build-book.sh

# Build specific format
./build-book.sh html
./build-book.sh pdf
./build-book.sh epub

# Clean build artifacts
./build-book.sh clean
```

## Output Formats

The build script generates three formats:

### HTML
- **Single-page HTML** with table of contents and syntax highlighting
- Great for web hosting or offline reading
- Output: `output/html/building-with-larc.html`

### PDF
- **Professional PDF** suitable for printing
- Includes table of contents and page numbers
- Output: `output/pdf/building-with-larc.pdf`

### EPUB
- **E-reader format** for Kindle, iBooks, etc.
- Includes metadata and table of contents
- Output: `output/epub/building-with-larc.epub`

## Requirements

### Required Dependencies

1. **Pandoc** - Universal document converter
   ```bash
   brew install pandoc
   ```

2. **LaTeX** - For PDF generation (MacTeX without GUI)
   ```bash
   brew install --cask mactex-no-gui
   ```

### Optional Dependencies

3. **Prince XML** - For better PDF output (optional but recommended)
   - Download from: https://www.princexml.com/
   - Free for non-commercial use
   - Produces higher-quality PDFs than pdflatex

## Build Script Features

The `build-book.sh` script:

✅ Checks for required dependencies
✅ Combines all 33 markdown files in correct order
✅ Generates metadata (title, author, date, version)
✅ Creates table of contents with 3 levels
✅ Numbers all sections and subsections
✅ Applies syntax highlighting to code blocks
✅ Includes CSS styling for HTML and PDF
✅ Creates EPUB with proper metadata
✅ Color-coded console output
✅ Handles missing optional dependencies gracefully

## Customization

### Styling

Edit the generated CSS files to customize appearance:

- `book-style.css` - HTML styling
- `book-style-print.css` - PDF/print styling

The script creates default CSS files if they don't exist. Once created, you can modify them and they won't be overwritten.

### Cover Image

Add a cover image for the EPUB format:

```bash
# Place a PNG image named cover.png in the book directory
cp your-cover.png cover.png

# Rebuild
./build-book.sh epub
```

Recommended size: 1600x2400 pixels

### Metadata

Edit the metadata in `build-book.sh`:

```bash
BOOK_TITLE="Building with LARC: A Reference Manual"
BOOK_SUBTITLE="A Comprehensive Guide to Modern Web Applications"
AUTHOR="LARC Project Contributors"
VERSION="1.0.0"
```

## Build Process Details

### 1. Dependency Check
The script verifies that Pandoc and pdflatex are installed.

### 2. Directory Setup
Creates build directories:

- `build/` - Temporary build files
- `output/html/` - HTML output
- `output/pdf/` - PDF output
- `output/epub/` - EPUB output

### 3. Metadata Generation
Creates YAML frontmatter with book information.

### 4. Chapter Ordering
Combines all 33 markdown files in the correct sequence:

- Chapters 1-25
- Appendices A-G
- Index

### 5. Format Conversion
Uses Pandoc to convert markdown to target formats with appropriate options.

## Troubleshooting

### "pandoc: command not found"

Install Pandoc:
```bash
brew install pandoc
```

### "pdflatex: command not found"

Install MacTeX:
```bash
brew install --cask mactex-no-gui
```

Then add to your PATH:
```bash
export PATH="/Library/TeX/texbin:$PATH"
```

### PDF Generation Fails

If you get LaTeX errors:

1. Use Prince XML instead (if available)
2. Simplify markdown formatting in problematic chapters
3. Check for special characters that need escaping

### EPUB Validation

Validate your EPUB file:
```bash
brew install epubcheck
epubcheck output/epub/building-with-larc.epub
```

### File Not Found Errors

Make sure you're running the script from the correct directory:
```bash
cd /Users/cdr/Projects/larc-repos/docs/building-with-larc
./build-book.sh
```

## Advanced Usage

### Custom Pandoc Options

Edit `build-book.sh` to add custom Pandoc options:

```bash
# Example: Add custom template
pandoc \
    --template=custom-template.html \
    ...
```

### Partial Builds

Build only specific chapters by editing `build/book-order.txt`:

```bash
# Edit to include only desired chapters
./build-book.sh html
```

### Multi-page HTML

For a multi-page HTML version, split by chapters:

```bash
for chapter in chapter-*.md; do
    pandoc "$chapter" \
        -o "output/html/${chapter%.md}.html" \
        --standalone \
        --css=book-style.css
done
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Build Book
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:

      - uses: actions/checkout@v3
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y pandoc texlive-xetex

      - name: Build book
        run: |
          cd docs/building-with-larc
          ./build-book.sh
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: book-outputs
          path: docs/building-with-larc/output/
```

## File Structure

```
building-with-larc/
├── README.md                    # Main documentation
├── BUILD.md                     # This file
├── build-book.sh               # Build script
├── book-style.css              # HTML/PDF styles (generated)
├── book-style-print.css        # Print-specific styles (generated)
├── cover.png                   # Optional cover image
├── chapter-01-introduction.md  # Chapter files
├── chapter-02-philosophy.md
├── ...
├── appendix-a-message-topics.md
├── ...
├── build/                      # Build artifacts (generated)
│   ├── metadata.yaml
│   ├── epub-metadata.xml
│   └── book-order.txt
└── output/                     # Generated books
    ├── html/
    │   ├── building-with-larc.html
    │   └── book-style.css
    ├── pdf/
    │   └── building-with-larc.pdf
    └── epub/
        └── building-with-larc.epub
```

## Publishing

### Web Hosting

Deploy the HTML version:

```bash
# Copy to web server
scp -r output/html/* user@server:/var/www/docs/

# Or use GitHub Pages
cp -r output/html/* docs/
git add docs/
git commit -m "Update book HTML"
git push
```

### PDF Distribution

The PDF is ready for:

- Print-on-demand services (Lulu, CreateSpace)
- Digital download
- E-commerce platforms (Gumroad, etc.)

### EPUB Distribution

The EPUB works with:

- Amazon Kindle (may need conversion with Kindle Previewer)
- Apple Books
- Google Play Books
- Kobo
- Barnes & Noble Nook

## Performance

Build times (approximate):

- HTML: 2-3 seconds
- PDF (pdflatex): 20-30 seconds
- PDF (Prince): 10-15 seconds
- EPUB: 3-5 seconds
- All formats: 30-40 seconds

## Version History

- **v1.0.0** - Initial release (December 2025)
  - 25 chapters
  - 7 appendices
  - ~115,000 words
  - 200+ code examples

## Support

For issues with the book build process:

1. Check this BUILD.md file
2. Verify dependencies are installed
3. Check the script output for error messages
4. See troubleshooting section above

For content issues:

- Open an issue on GitHub
- Submit a pull request with corrections

## License

The build script is part of the LARC project and follows the same license as the framework.
