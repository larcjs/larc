# Setting Up npm 2FA via Web Browser

Since the terminal isn't showing a QR code, let's do this via the web:

## Step 1: Go to npm Account Settings

**Correct URL:** https://www.npmjs.com/settings/cdr420/account

## Step 2: Find Two-Factor Authentication Section

Look for:
- "Two-Factor Authentication"
- Or "Security" section
- Should show current status (enabled/disabled)

## Step 3: Enable 2FA

Click "Enable 2FA" or "Manage 2FA"

You'll see:
1. **QR Code** - Scan with authenticator app
2. **Secret Key** - Type manually if camera doesn't work

## Step 4: Add to Authenticator App

On your phone:
1. Open authenticator app
2. Tap "+" or "Add"
3. Either:
   - **Scan QR code** (point camera at screen)
   - **Enter key manually** (type the secret shown)
4. It should create "npm" or "npmjs" entry

## Step 5: Verify

1. Get 6-digit code from app
2. Enter it on the npm website to confirm
3. **Save recovery codes!**

## Step 6: Publish

Once set up, tell me the 6-digit code and I'll publish:

```bash
npm publish --otp=123456
```

---

## Alternative URLs to Try:

- https://www.npmjs.com/settings/cdr420/account
- https://www.npmjs.com/settings/cdr420/security
- https://www.npmjs.com/settings/cdr420

One of these should have the 2FA settings!
