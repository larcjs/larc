# Add Authenticator App to npm 2FA

You have passkey enabled, but for publishing you need **TOTP (authenticator app)**.

## Option 1: Add Authenticator as Additional Method

1. Go to: https://www.npmjs.com/settings/cdr420/account
2. Scroll to "Two-Factor Authentication" section
3. Look for "Add authentication method" or "Manage 2FA methods"
4. Choose **"Authenticator app"** or **"TOTP"**
5. It will show QR code
6. Scan with your phone authenticator app
7. Enter verification code

Now you'll have **BOTH**:
- Passkey (for logging in)
- Authenticator app (for publishing)

## Option 2: Try Publishing with Passkey

Some newer npm versions accept passkey for OTP. Try:

```bash
cd packages/core
npm publish
```

If it prompts for biometric/passkey instead of code, use that!

## Option 3: Disable Passkey, Use Authenticator Only

If you can't add authenticator alongside passkey:

1. Go to: https://www.npmjs.com/settings/cdr420/account
2. Disable/remove passkey 2FA
3. Re-enable 2FA but choose **"Authenticator app"**
4. Scan QR code with phone
5. Now use authenticator codes for publishing

---

## Quick Test

In your terminal, try publishing:

```bash
cd packages/core
npm publish
```

See what it prompts for:
- If it asks for passkey → use fingerprint/Face ID
- If it asks for OTP → you need authenticator app

Let me know what happens!
