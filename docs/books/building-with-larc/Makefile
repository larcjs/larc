# Building with LARC - Makefile
#
# Simple targets for building the book in various formats

.PHONY: all html pdf epub docx kindle clean help install view

# Default target
all: html pdf epub docx

# Build HTML version
html:
	@./build-book.sh html

# Build PDF version
pdf:
	@./build-book.sh pdf

# Build EPUB version
epub:
	@./build-book.sh epub

# Build DOCX version (for Kindle Create)
docx:
	@./build-book.sh docx

# Alias for docx (Kindle Create format)
kindle: docx

# Clean build artifacts
clean:
	@./build-book.sh clean

# Install dependencies (macOS)
install:
	@echo "Installing dependencies..."
	@command -v brew >/dev/null 2>&1 || { echo "Homebrew is required. Install from https://brew.sh"; exit 1; }
	@command -v pandoc >/dev/null 2>&1 || brew install pandoc
	@command -v pdflatex >/dev/null 2>&1 || brew install --cask mactex-no-gui
	@echo "✓ Dependencies installed"

# View generated files
view: view-html

view-html:
	@open output/html/building-with-larc.html 2>/dev/null || echo "HTML file not found. Run 'make html' first."

view-pdf:
	@open output/pdf/building-with-larc.pdf 2>/dev/null || echo "PDF file not found. Run 'make pdf' first."

view-epub:
	@open output/epub/building-with-larc.epub 2>/dev/null || echo "EPUB file not found. Run 'make epub' first."

view-docx:
	@open output/docx/building-with-larc.docx 2>/dev/null || echo "DOCX file not found. Run 'make docx' first."

# Help message
help:
	@echo "Building with LARC - Book Build System"
	@echo ""
	@echo "Usage:"
	@echo "  make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  all        Build all formats (HTML, PDF, EPUB, DOCX)"
	@echo "  html       Build HTML version only"
	@echo "  pdf        Build PDF version only"
	@echo "  epub       Build EPUB version only"
	@echo "  docx       Build DOCX version (for Kindle Create)"
	@echo "  kindle     Alias for docx"
	@echo "  clean      Remove build artifacts"
	@echo "  install    Install required dependencies (macOS)"
	@echo "  view       Open generated HTML file"
	@echo "  view-html  Open generated HTML file"
	@echo "  view-pdf   Open generated PDF file"
	@echo "  view-epub  Open generated EPUB file"
	@echo "  view-docx  Open generated DOCX file"
	@echo "  help       Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make              # Build all formats"
	@echo "  make html         # Build HTML only"
	@echo "  make clean all    # Clean and rebuild"
	@echo "  make install      # Install dependencies"
	@echo "  make html view    # Build and open HTML"
