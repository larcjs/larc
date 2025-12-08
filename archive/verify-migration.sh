#!/bin/bash
#
# Verify LARC Migration Success
#

set -e

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_BLUE}╔════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_BLUE}║  LARC Migration Verification          ║${COLOR_RESET}"
echo -e "${COLOR_BLUE}╚════════════════════════════════════════╝${COLOR_RESET}"
echo ""

PASS=0
FAIL=0

check() {
    if [ $? -eq 0 ]; then
        echo -e "${COLOR_GREEN}✓${COLOR_RESET} $1"
        ((PASS++))
    else
        echo -e "${COLOR_RED}✗${COLOR_RESET} $1"
        ((FAIL++))
    fi
}

# Test 1: Check directories exist
echo "Checking directory structure..."
[ -d "packages/core-types" ]
check "packages/core-types exists"

[ -d "packages/components-types" ]
check "packages/components-types exists"

[ -d "packages/devtools" ]
check "packages/devtools exists"

[ -d "docs/site" ]
check "docs/site exists"

# Test 2: Check workspace files
echo ""
echo "Checking workspace configuration..."
[ -f "package.json" ]
check "package.json exists"

[ -f "pnpm-workspace.yaml" ]
check "pnpm-workspace.yaml exists"

grep -q "workspaces" package.json
check "package.json has workspaces"

# Test 3: Check node_modules links
echo ""
echo "Checking npm workspace links..."
[ -L "node_modules/@larcjs/core-types" ]
check "core-types symlink exists"

[ -L "node_modules/@larcjs/components-types" ]
check "components-types symlink exists"

[ -L "node_modules/@larcjs/devtools" ]
check "devtools symlink exists"

# Test 4: Check package.json files
echo ""
echo "Checking package.json files..."
[ -f "packages/core-types/package.json" ]
check "core-types has package.json"

grep -q "larcjs/larc" packages/core-types/package.json
check "core-types points to monorepo"

[ -f "packages/components-types/package.json" ]
check "components-types has package.json"

grep -q "larcjs/larc" packages/components-types/package.json
check "components-types points to monorepo"

[ -f "packages/devtools/package.json" ]
check "devtools has package.json"

# Test 5: Check submodules
echo ""
echo "Checking remaining submodules..."
grep -q "core" .gitmodules
check ".gitmodules has core"

grep -q "ui" .gitmodules
check ".gitmodules has ui"

! grep -q "core-types" .gitmodules
check ".gitmodules removed core-types"

! grep -q "components-types" .gitmodules
check ".gitmodules removed components-types"

! grep -q "site" .gitmodules
check ".gitmodules removed site"

# Test 6: Check file contents
echo ""
echo "Checking file contents..."
[ -f "packages/core-types/index.d.ts" ]
check "core-types has index.d.ts"

[ -f "packages/components-types/index.d.ts" ]
check "components-types has index.d.ts"

[ -f "packages/devtools/manifest.json" ]
check "devtools has manifest.json"

[ -f "docs/site/index.html" ]
check "site has index.html"

# Test 7: Check backups
echo ""
echo "Checking backups..."
[ -f ".gitmodules.backup" ]
check "gitmodules backup exists"

ls /tmp/larc-backup-*.tar.gz 2>/dev/null | grep -q "."
check "tar backup exists"

[ -d "/tmp/larc-migration-backup-"* ] 2>/dev/null
check "migration backup exists"

# Summary
echo ""
echo "════════════════════════════════════════"
echo "Verification Summary:"
echo "════════════════════════════════════════"
echo -e "${COLOR_GREEN}✓ Passed: $PASS${COLOR_RESET}"
if [ $FAIL -gt 0 ]; then
    echo -e "${COLOR_RED}✗ Failed: $FAIL${COLOR_RESET}"
else
    echo -e "${COLOR_GREEN}✗ Failed: 0${COLOR_RESET}"
fi
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${COLOR_GREEN}✅ Migration verification PASSED!${COLOR_RESET}"
    echo ""
    echo "✓ All checks passed"
    echo "✓ Directory structure correct"
    echo "✓ Workspace configured properly"
    echo "✓ Packages symlinked correctly"
    echo "✓ Files migrated successfully"
    echo "✓ Backups created"
    echo ""
    echo "🚀 Ready to commit!"
    echo ""
    echo "Next steps:"
    echo "  git add ."
    echo "  git commit -m 'Migrate to monorepo structure'"
    echo "  git push"
    exit 0
else
    echo -e "${COLOR_RED}❌ Migration verification FAILED${COLOR_RESET}"
    echo ""
    echo "Please review the failed checks above."
    exit 1
fi
