# Quick Start Guide - Building "Learning LARC"

Get your book built in 3 easy steps!

## 1️⃣ Install Dependencies (One Time)

### macOS

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Pandoc and LaTeX
brew install pandoc
brew install --cask mactex-no-gui

# Add LaTeX to your PATH
echo 'export PATH="/Library/TeX/texbin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Optional: Install Mermaid CLI for diagrams
npm install -g @mermaid-js/mermaid-cli
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y pandoc texlive-xetex texlive-latex-extra

# Optional: Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli
```

## 2️⃣ Build the Book

### Option A: Using the Shell Script (Recommended)

```bash
cd /Users/cdr/Projects/larc-repos/docs/books/learning-larc

# Build everything (HTML, PDF, EPUB)
./build-book.sh

# Or build specific formats
./build-book.sh html
./build-book.sh pdf
./build-book.sh epub
```

### Option B: Using Make

```bash
cd /Users/cdr/Projects/larc-repos/docs/books/learning-larc

# Build everything
make

# Or specific formats
make html
make pdf
make epub

# Build and open
make html view
```

### Option C: Using npm

```bash
cd /Users/cdr/Projects/larc-repos/docs/books/learning-larc

# Build everything
npm run build

# Or specific formats
npm run build:html
npm run build:pdf
npm run build:epub

# Build and open
npm run build:html && npm run view:html
```

## 3️⃣ View Your Book

The built files are in the `build/output/` directory:

```bash
# Open HTML in browser
open build/output/learning-larc.html

# Open PDF
open build/output/learning-larc.pdf

# Open EPUB (opens in your default e-reader)
open build/output/learning-larc.epub
```

## That's It! 🎉

You now have your book in three formats:

- 📄 **HTML** - Web-friendly, syntax highlighted, with table of contents
- 📕 **PDF** - Print-ready, professionally formatted with your beautiful Lark cover
- 📱 **EPUB** - E-reader compatible (Kindle, iBooks, etc.)

## Features

✨ **Includes your hand-drawn Lark cover** on the EPUB version
✨ **Converts Mermaid diagrams** to images automatically
✨ **Front and back cover content** included
✨ **Author bio** included
✨ **Professional formatting** with syntax highlighting

## Troubleshooting

### "Command not found: pandoc"

Install Pandoc:
```bash
brew install pandoc
```

### "Command not found: pdflatex"

Install LaTeX:
```bash
brew install --cask mactex-no-gui
```

Then add to PATH:
```bash
export PATH="/Library/TeX/texbin:$PATH"
```

### Diagrams not converting

Install Mermaid CLI:
```bash
npm install -g @mermaid-js/mermaid-cli
```

### Permission denied

Make the script executable:
```bash
chmod +x build-book.sh
```

## Build Times

Typical build times on a modern Mac:
- HTML: ~2 seconds
- PDF: ~20 seconds
- EPUB: ~4 seconds
- **All formats: ~25 seconds**

## Pro Tips

💡 **Quick HTML preview**: HTML builds are fast, perfect for reviewing changes
```bash
make html view
```

💡 **Use your cover**: The script automatically detects `larc-book.png` or `cover.png`

💡 **Include diagrams**: Mermaid diagrams in `/diagrams` are converted to images

💡 **Custom styling**: Edit the CSS in `build-book.sh` if needed

---

**Happy Publishing! 📚🐦**
