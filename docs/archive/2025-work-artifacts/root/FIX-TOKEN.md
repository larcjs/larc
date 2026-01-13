# Fix Token Issue

Your current token doesn't have "2FA bypass" enabled. You need an **Automation** token.

## Option 1: Create Automation Token (Recommended)

1. Go to: https://www.npmjs.com/settings/cdr420/tokens
2. Click **"Generate New Token"**
3. Select **"Automation"** (NOT "Publish")
4. Copy the token (starts with `npm_...`)
5. Save it to `.tmp` file:
   ```bash
   echo "npm_YOUR_TOKEN_HERE" > .tmp
   ```
6. Then I'll set it up and publish!

## Option 2: Use Current Token with OTP

If your token is a "Publish" token, you need to pass OTP:

```bash
cd packages/core
npm publish --otp=123456  # Get code from authenticator app
```

---

## How to Check Token Type

The error says you need an automation token. Here's the difference:

- **Publish token**: Requires 2FA code with `--otp` flag
- **Automation token**: Bypasses 2FA (for CI/CD)

You probably created a "Publish" token, but need "Automation".

---

## Quick Fix

Just create a new "Automation" token and put it in `.tmp`, then let me know!
