# Setting Up npm 2FA with Authenticator App

## Step 1: Enable 2FA on npm

```bash
npm profile enable-2fa auth-and-writes
```

This will:
1. Generate a QR code in your terminal
2. Ask you to scan it with your authenticator app

## Step 2: Scan QR Code

Use any authenticator app:
- **Google Authenticator** (iOS/Android)
- **Authy** (iOS/Android/Desktop)
- **1Password** (has built-in authenticator)
- **Microsoft Authenticator**
- **Any TOTP app**

1. Open your authenticator app
2. Click "Add account" or "+"
3. Scan the QR code shown in terminal
4. The app will show a 6-digit code

## Step 3: Enter Confirmation Code

```bash
# npm will ask for a code - enter it from your app
Enter OTP: [type 6-digit code]
```

## Step 4: Save Recovery Codes

npm will show you recovery codes - **SAVE THESE!**

```
Recovery codes:
  xxxx-xxxx-xxxx
  xxxx-xxxx-xxxx
  (save somewhere safe!)
```

## Done! Now Publishing Works

### Publishing with 2FA:

```bash
cd packages/core
npm publish --otp=123456  # Get code from app
```

The code changes every 30 seconds, so:
1. Open authenticator app
2. Copy the 6-digit code for "npm"
3. Run publish command with --otp flag
4. Done!

---

## Alternative: Use Automation Token (No 2FA Needed)

If you want to skip entering OTP every time:

### Create an Automation Token:

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token"
3. Select **"Automation"** (bypasses 2FA)
4. Copy the token (starts with `npm_...`)

### Use the Token:

```bash
# Set the token (one-time setup)
npm set //registry.npmjs.org/:_authToken npm_XXXXXXXXXXXXXXXX

# Now publish without OTP
cd packages/core
npm publish  # No --otp needed!
```

**Security Note:** Automation tokens are more convenient but less secure. Use them for CI/CD, not personal computers.

---

## Troubleshooting

### "Invalid OTP"
- Code expires every 30 seconds - try a fresh one
- Make sure you're using the code for "npm" (not another service)
- Time on your computer and phone must be synchronized

### "Already enabled"
Check your current 2FA status:
```bash
npm profile get
```

### Disable 2FA (if needed):
```bash
npm profile disable-2fa
```

---

## Quick Reference

```bash
# Enable 2FA
npm profile enable-2fa auth-and-writes

# Check 2FA status
npm profile get

# Publish with OTP
npm publish --otp=123456

# Use automation token instead
npm set //registry.npmjs.org/:_authToken npm_XXXXX
```
