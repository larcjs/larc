# Publish with 2FA

## Option 1: Publish with OTP (Recommended)

Get your 2FA code from your authenticator app, then:

```bash
cd packages/core
npm publish --otp=123456
```

Replace `123456` with your actual 6-digit code.

**Note:** The code expires quickly (30 seconds), so have it ready before running the command!

## Option 2: Use npm Token (Automation)

For automated publishing, create a token with 2FA bypass:

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → "Automation"
3. Copy the token
4. Set it locally:
   ```bash
   npm config set //registry.npmjs.org/:_authToken YOUR_TOKEN
   ```
5. Then publish normally:
   ```bash
   cd packages/core
   npm publish
   ```

---

## What Gets Published

**@larcjs/core@2.1.0** including:
- pan.mjs (autoloader)
- pan-bus.mjs, pan-client.mjs, pan-storage.mjs
- components/ (130 component files - 2.5MB)

## After Publishing

Wait ~5 minutes for CDN sync, then test:

```bash
# Verify on npm
npm view @larcjs/core@2.1.0

# Test CDN
curl -I https://cdn.jsdelivr.net/npm/@larcjs/core@2.1.0/pan.mjs
curl -I https://cdn.jsdelivr.net/npm/@larcjs/core@2.1.0/components/pan-card.mjs
```

## Push to GitHub

```bash
git push origin main
git tag @larcjs/core@2.1.0
git push --tags
```
