# Publishing LARC VS Code Extension

## Prerequisites

1. **VS Code Extension Manager (vsce)**
   ```bash
   npm install -g @vscode/vsce
   ```

2. **Azure DevOps Account** (for publishing)
   - Create at: https://dev.azure.com
   - Create Personal Access Token (PAT)
     - Organization: All accessible organizations
     - Scopes: Marketplace (Manage)

3. **Publisher ID**
   - Create at: https://marketplace.visualstudio.com/manage
   - Choose a unique publisher ID (e.g., "larcjs")

## Pre-Publishing Checklist

- [x] package.json configured
- [x] README.md with screenshots/examples
- [x] LICENSE file
- [x] .vscodeignore configured
- [ ] Extension icon (128x128 PNG)
- [ ] CHANGELOG.md
- [ ] Test extension locally

## Testing Locally

```bash
# Install dependencies
npm install

# Package extension (creates .vsix file)
vsce package

# Install locally for testing
code --install-extension larc-vscode-1.0.0.vsix

# Test in VS Code
# - Open a LARC project
# - Try snippets
# - Try commands (Ctrl+Shift+P → "LARC: ...")
# - Verify IntelliSense works
```

## Create Extension Icon

Create a 128x128 PNG icon and save as `icon.png` in the extension root.

Quick way using ImageMagick:
```bash
# Create a simple icon (or design your own)
convert -size 128x128 xc:blue -pointsize 72 -fill white \
  -gravity center -annotate +0+0 "L" icon.png
```

Or use an online tool like Figma, Canva, or any image editor.

## Create CHANGELOG.md

```markdown
# Change Log

## [1.0.0] - 2025-01-XX

### Added
- Initial release
- Component code snippets
- PAN bus utilities snippets
- Commands for component management
- IntelliSense for LARC components
- Registry integration
```

## Publishing Steps

### 1. Create Publisher

```bash
# Login to VS Code Marketplace
vsce login <publisher-id>

# Enter your Personal Access Token when prompted
```

### 2. Update package.json

Ensure `publisher` field matches your publisher ID:

```json
{
  "publisher": "larcjs"
}
```

### 3. Package Extension

```bash
# Create .vsix package
vsce package

# This creates: larc-vscode-1.0.0.vsix
```

### 4. Publish

```bash
# Publish to marketplace
vsce publish

# Or publish specific version
vsce publish 1.0.0

# Or publish with PAT directly
vsce publish -p <your-personal-access-token>
```

### 5. Verify Publication

- Check marketplace: https://marketplace.visualstudio.com/items?itemName=larcjs.larc-vscode
- Install in VS Code: Search for "LARC" in Extensions
- Verify all features work

## Alternative: Manual Upload

If `vsce publish` doesn't work, you can upload manually:

1. Package: `vsce package`
2. Go to: https://marketplace.visualstudio.com/manage
3. Click "New extension" → "Visual Studio Code"
4. Upload the .vsix file

## Post-Publishing

1. **Update README badges:**
   ```markdown
   ![Version](https://img.shields.io/visual-studio-marketplace/v/larcjs.larc-vscode)
   ![Installs](https://img.shields.io/visual-studio-marketplace/i/larcjs.larc-vscode)
   ![Rating](https://img.shields.io/visual-studio-marketplace/r/larcjs.larc-vscode)
   ```

2. **Create GitHub release**

3. **Announce on social media/Discord**

## Updating the Extension

When making updates:

```bash
# Update version in package.json
npm version patch  # or minor, major

# Update CHANGELOG.md

# Package and publish
vsce package
vsce publish
```

## CI/CD (Optional)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Extension

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run package
      - name: Publish
        run: npx vsce publish -p ${{ secrets.VSCE_PAT }}
```

Store your PAT in GitHub Secrets as `VSCE_PAT`.

## Troubleshooting

### "Publisher not found"
- Create publisher at: https://marketplace.visualstudio.com/manage
- Ensure `publisher` in package.json matches

### "Extension already exists"
- Update version number
- Or update existing extension

### "Icon missing"
- Add `icon.png` (128x128) to root
- Reference in package.json: `"icon": "icon.png"`

### "README not rendering"
- Ensure README.md uses relative paths for images
- Images should be in repository

## Success Checklist

- [ ] Extension visible in VS Code Marketplace
- [ ] Installs correctly via VS Code
- [ ] All snippets work
- [ ] All commands work
- [ ] IntelliSense provides suggestions
- [ ] Icon displays correctly
- [ ] README displays correctly

## Resources

- vsce docs: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- Marketplace: https://marketplace.visualstudio.com/manage
- Extension Guidelines: https://code.visualstudio.com/api/references/extension-guidelines
