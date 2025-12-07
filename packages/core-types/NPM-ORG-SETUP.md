# NPM Organization Setup Required

To publish @larcjs packages to npm, you need to create the @larcjs organization first.

## Steps:

1. Go to https://www.npmjs.com/org/create
2. Create organization with name: **larcjs**
3. Make it public (free)
4. Add collaborators if needed

## After Organization is Created:

```bash
cd /Users/cdr/Projects/larc-repos/core-types
npm publish --access public
```

## Verify Organization:

```bash
npm org ls larcjs
```

This will show members of the organization.
