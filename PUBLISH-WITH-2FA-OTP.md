# Publishing with 2FA (Simplest Method)

Since npm deprecated classic tokens, the **easiest way** is to use 2FA with `--otp` flag.

## Quick Setup (if 2FA not enabled)

```bash
npm profile enable-2fa auth-and-writes
```

Follow the prompts:
1. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
2. Enter the 6-digit code
3. Save recovery codes somewhere safe

## Publishing with OTP

```bash
cd packages/core

# Get 6-digit code from authenticator app, then:
npm publish --otp=123456
```

Replace `123456` with your actual code from the app.

**The code changes every 30 seconds**, so have your phone ready!

---

## Alternative: Granular Access Token (More Complex)

If you don't want to enter OTP every time:

1. Go to https://www.npmjs.com/settings/cdr420/tokens
2. Click "Generate New Token"
3. Choose **"Granular Access Token"**
4. Set permissions:
   - **Packages and scopes**: Select @larcjs/core
   - **Permissions**: Read and write
   - **Organizations**: (leave default)
5. Click "Generate Token"
6. Copy token and save to `.tmp`

Then I'll configure it.

---

## Which Is Easier?

**For one-time publishing: Use `--otp` (simpler!)**
- Just need authenticator app
- Run `npm publish --otp=CODE`
- Done!

**For frequent publishing: Use Granular Token**
- More setup upfront
- No OTP needed each time
- Better for automation

---

## Ready to Publish?

If you have 2FA enabled, just run:

```bash
cd packages/core
npm publish --otp=YOUR_CODE
```

Get the code from your authenticator app!
