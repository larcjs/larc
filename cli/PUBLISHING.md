# Publishing create-larc-app to npm

## Prerequisites

1. **npm account** - Create one at https://www.npmjs.com/signup
2. **npm CLI** - Should be installed with Node.js
3. **npm login** - Run `npm login` and enter your credentials

## Pre-Publishing Checklist

- [x] Package.json configured
- [x] README.md created
- [x] LICENSE file added
- [x] .npmignore configured
- [x] Bin files are executable (`chmod +x bin/*.js`)
- [x] All dependencies listed
- [ ] Test locally with `npm link`

## Testing Locally

Before publishing, test the CLI locally:

```bash
# In the cli directory
npm link

# Test create-larc-app command
create-larc-app test-app --yes

# Test larc command
cd test-app
larc --version

# Unlink when done testing
npm unlink -g create-larc-app
```

## Publishing Steps

### 1. Verify Package Contents

```bash
# See what will be published
npm pack --dry-run
```

This shows which files will be included in the package.

### 2. Version Check

Ensure the version in `package.json` is correct:
- First release: `1.0.0`
- Bug fixes: increment patch (1.0.x)
- New features: increment minor (1.x.0)
- Breaking changes: increment major (x.0.0)

### 3. Login to npm

```bash
npm login
```

Enter your credentials when prompted.

### 4. Publish

```bash
# For first release (public package)
npm publish --access public

# For subsequent releases
npm publish
```

### 5. Verify Publication

```bash
# Check on npm
https://www.npmjs.com/package/create-larc-app

# Test installation
npx create-larc-app my-test-app
```

## Post-Publishing

1. **Tag the release in git:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Create GitHub release:**
   - Go to GitHub repository
   - Create new release
   - Use version tag
   - Add release notes

3. **Update documentation:**
   - Add installation instructions
   - Update version numbers in README

## Updating the Package

When you need to publish updates:

```bash
# Update version
npm version patch  # or minor, major

# Publish
npm publish

# Push tags
git push --follow-tags
```

## Scoped Package (Alternative)

If you want to publish under an org scope:

```json
{
  "name": "@larcjs/create-larc-app"
}
```

Then publish with:
```bash
npm publish --access public
```

## Troubleshooting

### "Package name already taken"
- Choose a different name or
- Use a scoped package: `@yourusername/create-larc-app`

### "Permission denied"
- Ensure you're logged in: `npm whoami`
- Check you have publish rights

### "Files not included"
- Check `files` field in package.json
- Check `.npmignore`
- Use `npm pack --dry-run` to verify

## Success Checklist

After publishing:
- [ ] Package visible on npmjs.com
- [ ] `npx create-larc-app` works globally
- [ ] `npm install create-larc-app` works
- [ ] All commands work (`larc dev`, `larc add`, etc.)
- [ ] README displays correctly on npm
- [ ] GitHub release created
- [ ] Documentation updated

## Support

If you encounter issues:
- Check npm docs: https://docs.npmjs.com/cli/publish
- npm support: https://www.npmjs.com/support
