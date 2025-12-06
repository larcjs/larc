# Quick Start Guide - Book Building

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
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y pandoc texlive-xetex texlive-latex-extra
```

### Windows (WSL or native)

```bash
# Using Chocolatey
choco install pandoc
choco install miktex

# Or download installers:
# Pandoc: https://pandoc.org/installing.html
# MiKTeX: https://miktex.org/download
```

## 2️⃣ Build the Book

### Option A: Using the Shell Script (Recommended)

```bash
cd /Users/cdr/Projects/larc-repos/docs/building-with-larc

# Build everything (HTML, PDF, EPUB)
./build-book.sh

# Or build specific formats
./build-book.sh html
./build-book.sh pdf
./build-book.sh epub
```

### Option B: Using Make

```bash
cd /Users/cdr/Projects/larc-repos/docs/building-with-larc

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
cd /Users/cdr/Projects/larc-repos/docs/building-with-larc

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

The built files are in the `output/` directory:

```bash
# Open HTML in browser
open output/html/building-with-larc.html

# Open PDF
open output/pdf/building-with-larc.pdf

# Open EPUB (opens in your default e-reader)
open output/epub/building-with-larc.epub
```

## That's It! 🎉

You now have your book in three formats:

- 📄 **HTML** - Web-friendly, syntax highlighted, with table of contents
- 📕 **PDF** - Print-ready, professionally formatted
- 📱 **EPUB** - E-reader compatible (Kindle, iBooks, etc.)

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

### Build fails with LaTeX errors

Try installing Prince XML for better PDF generation:

- Download from: https://www.princexml.com/
- The script will automatically use it if available

### Permission denied

Make the script executable:
```bash
chmod +x build-book.sh
```

## Next Steps

- **Customize styling**: Edit `book-style.css` after first build
- **Add cover image**: Place `cover.png` in the book directory
- **Read BUILD.md**: For advanced options and customization
- **Check README.md**: For complete book documentation

## Build Times

Typical build times on a modern Mac:

- HTML: ~2 seconds
- PDF: ~25 seconds (15 seconds with Prince XML)
- EPUB: ~4 seconds
- **All formats: ~30 seconds**

## Getting Help

1. Check `BUILD.md` for detailed documentation
2. Run `./build-book.sh --help` (coming soon)
3. Check for error messages in script output
4. Verify dependencies are installed correctly

## Pro Tips

💡 **Watch mode**: Rebuild HTML automatically on changes (requires fswatch)
```bash
npm run watch
```

💡 **Quick rebuild**: HTML builds are fast, perfect for iterating
```bash
make html view
```

💡 **Custom CSS**: Modify `book-style.css` to change appearance
```bash
# After first build, edit:
nano book-style.css
make html view
```

💡 **Partial builds**: Edit `build/book-order.txt` to build only specific chapters

---

**Happy Publishing! 📚**
