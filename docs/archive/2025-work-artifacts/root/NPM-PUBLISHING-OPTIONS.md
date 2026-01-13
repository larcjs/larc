# npm Publishing Options (2024+)

npm changed their token system. Here are your options:

## Option 1: Classic Token (For Local Publishing) ✅ EASIEST

This is what you need for publishing from your computer:

1. Go to https://www.npmjs.com/settings/cdr420/tokens
2. Click **"Generate New Token"**
3. Choose **"Classic Token"**
4. Select **"Automation"** (NOT "Publish")
5. Copy the token
6. Save it to `.tmp`:
   ```bash
   echo "npm_XXXXXXXX" > .tmp
   ```

Then I'll set it up and publish!

---

## Option 2: Use 2FA (No Token Needed)

Just enable 2FA and use it when publishing:

```bash
# Enable 2FA (one-time setup)
npm profile enable-2fa auth-and-writes

# Publish with OTP code
cd packages/core
npm publish --otp=123456  # Get from authenticator app
```

---

## Option 3: Trusted Publishing (For CI/CD Only)

**This is NOT for local publishing!**

Trusted Publishing uses GitHub Actions/GitLab CI. It's for automated publishing when you push to GitHub, not for manual publishing from your computer.

If you want this later, we can set it up in GitHub Actions.

---

## What I Recommend

**For now: Use a Classic Automation Token**

1. Create "Classic Token" → "Automation" type
2. Put it in `.tmp` file
3. Let me know - I'll publish immediately!

Later we can set up Trusted Publishing for automated releases via GitHub Actions.

---

## Can You See "Classic Token"?

When you click "Generate New Token", do you see:
- ✅ **Classic Token** (choose this!)
- ❌ **Granular Access Token** (more complex)
- ❌ **Trusted Publishing** (CI/CD only)

Choose "Classic Token" → "Automation"
