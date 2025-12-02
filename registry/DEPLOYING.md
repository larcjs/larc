# Deploying Registry to GitHub Pages

## Prerequisites

- GitHub repository for the registry
- Push access to the repository
- GitHub Pages enabled

## Setup Steps

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll to **Pages** section
4. Under **Source**, select:
   - Source: **GitHub Actions**

### 2. Configure Repository

The `.github/workflows/deploy.yml` file is already configured. It will:
- Trigger on pushes to `main` branch
- Build the registry
- Deploy to GitHub Pages

### 3. Deploy

Simply push to the `main` branch:

```bash
git add .
git commit -m "Deploy registry"
git push origin main
```

The GitHub Action will automatically:
1. Install dependencies
2. Run `npm run build`
3. Deploy `public/` directory to GitHub Pages

### 4. Verify Deployment

After the action completes (1-2 minutes):
- Visit: `https://<username>.github.io/<repository-name>/`
- Or your custom domain if configured

### Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Build registry
npm run build

# Deploy using gh-pages package
npm install -g gh-pages
gh-pages -d public
```

## Custom Domain (Optional)

To use a custom domain (e.g., `components.larcjs.com`):

### 1. Add CNAME file

Create `public/CNAME` with your domain:
```
components.larcjs.com
```

### 2. Configure DNS

Add DNS records at your domain provider:
```
Type: CNAME
Name: components (or @ for apex domain)
Value: <username>.github.io
```

For apex domain, use A records:
```
Type: A
Name: @
Value: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153
```

### 3. Enable HTTPS

In GitHub Settings → Pages:
- Check "Enforce HTTPS"

## Configuration

### Base Path

If deploying to a subdirectory (e.g., `/registry/`), update paths in:

**public/js/app.js:**
```javascript
const REGISTRY_URL = '../registry.json'; // or absolute path
```

**public/index.html:**
```html
<base href="/registry/">
```

### Registry URL for CLI

Update the registry URL in the CLI's default config:

**cli/lib/add-component.js:**
```javascript
const REGISTRY_URL = 'https://username.github.io/registry/registry.json';
// or your custom domain
const REGISTRY_URL = 'https://components.larcjs.com/registry.json';
```

## Continuous Deployment

The GitHub Action is configured for CD:

1. **On every push to main:**
   - Runs `npm run build`
   - Validates components
   - Deploys to GitHub Pages

2. **On pull requests:**
   - Runs validation only (doesn't deploy)
   - Ensures components are valid before merge

## Monitoring

### Check Deployment Status

- Go to **Actions** tab in GitHub
- View the workflow runs
- Click on a run to see logs

### Debugging Failed Deployments

If deployment fails:

1. Check the Action logs
2. Common issues:
   - Missing dependencies
   - Invalid component JSON
   - Build script errors

3. Fix locally:
   ```bash
   npm run validate
   npm run build
   ```

4. Push fix and redeploy

## Branch Protection (Recommended)

Set up branch protection for `main`:

1. Settings → Branches
2. Add rule for `main`
3. Enable:
   - Require PR reviews
   - Require status checks (validate components)
   - Require branches to be up to date

This ensures only valid components are deployed.

## Performance

### CDN (Optional)

For better performance, use a CDN:

- **Cloudflare Pages**: Free, automatic
- **Netlify**: Free tier available
- **Vercel**: Free for open source

These provide:
- Global CDN
- Automatic HTTPS
- Better performance than GitHub Pages

### Caching

Add cache headers in `public/_headers` (for Netlify):
```
/registry.json
  Cache-Control: public, max-age=300

/js/*
  Cache-Control: public, max-age=31536000

/css/*
  Cache-Control: public, max-age=31536000
```

## Testing Locally

Before deploying, test locally:

```bash
# Build registry
npm run build

# Start dev server
npm run dev

# Open http://localhost:3000
```

## Success Checklist

- [ ] GitHub Pages enabled
- [ ] Workflow file committed
- [ ] Push triggers deployment
- [ ] Site accessible at GitHub Pages URL
- [ ] Registry loads correctly
- [ ] Components display properly
- [ ] Search and filters work
- [ ] Component modals open
- [ ] Links work correctly

## Resources

- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Custom Domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
