#!/bin/bash
#
# LARC Setup Script
# Sets up the complete LARC development environment
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║        LARC - Lightweight Asynchronous Relay Core        ║${NC}"
echo -e "${BLUE}║                    Setup Script                           ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print status messages
print_status() {
    echo -e "${GREEN}▶${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

print_success "Git is installed"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not in a git repository. Please run this script from the LARC root directory."
    exit 1
fi

# Initialize and update submodules
print_status "Initializing submodules..."
git submodule init

print_status "Updating submodules to latest commits..."
git submodule update --remote --recursive

print_success "All submodules updated!"

# List submodules
echo ""
print_status "Available repositories:"
echo ""
git submodule status | while read -r line; do
    commit=$(echo "$line" | awk '{print $1}')
    path=$(echo "$line" | awk '{print $2}')
    echo -e "  ${GREEN}✓${NC} $path ${BLUE}(${commit:0:7})${NC}"
done

# Check for Node.js (optional, but useful)
echo ""
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION is installed"
else
    print_warning "Node.js is not installed (optional, but recommended for running tests)"
fi

# Check for Python (for local server)
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "$PYTHON_VERSION is installed"
else
    print_warning "Python 3 is not installed (needed for local HTTP server)"
fi

# Print next steps
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Setup Complete!                        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo ""
echo "  1. Start a local server:"
echo -e "     ${YELLOW}python3 -m http.server 8000${NC}"
echo ""
echo "  2. Open your browser:"
echo -e "     ${YELLOW}http://localhost:8000/test-config.html${NC}  (Test configuration)"
echo -e "     ${YELLOW}http://localhost:8000/examples/${NC}         (View examples)"
echo -e "     ${YELLOW}http://localhost:8000/site/${NC}             (Documentation)"
echo ""
echo "  3. Read the documentation:"
echo -e "     ${YELLOW}README.md${NC}              - Project overview"
echo -e "     ${YELLOW}README-CONFIG.md${NC}       - Configuration system"
echo -e "     ${YELLOW}QUICK-START-CONFIG.md${NC}  - Quick reference"
echo ""
echo -e "${GREEN}Repository structure:${NC}"
echo "  core/        - Core PAN messaging bus"
echo "  components/  - UI component library"
echo "  examples/    - Demo applications"
echo "  site/        - Documentation website"
echo "  devtools/    - Chrome DevTools extension"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"
echo ""
