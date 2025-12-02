# Security Policy

## Supported Versions

We actively support the following versions of LARC with security updates:

| Package | Version | Supported |
|---------|---------|-----------|
| @larcjs/core | 1.1.x | ✅ Yes |
| @larcjs/core | 1.0.x | ✅ Yes |
| @larcjs/core | < 1.0 | ❌ No |
| @larcjs/components | 1.1.x | ✅ Yes |
| @larcjs/components | 1.0.x | ✅ Yes |
| @larcjs/components | < 1.0 | ❌ No |

**Security support window:** We provide security updates for the current major version (1.x) and the previous minor versions within that major version.

---

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in LARC, please follow these steps:

### 1. Report Privately

Send details to the maintainers via one of these methods:

**Preferred:** Use GitHub Security Advisories
- Go to https://github.com/larcjs/core/security/advisories
- Click "Report a vulnerability"
- Fill out the private vulnerability report form

**Alternative:** Open a security-specific discussion
- Mark it as "Security" category
- We will move it to a private channel immediately

### 2. What to Include

Please provide as much information as possible:

- **Type of vulnerability** (e.g., XSS, injection, CSRF)
- **Affected component(s)** (e.g., pan-bus, pan-client, specific UI component)
- **Affected version(s)**
- **Step-by-step reproduction**
- **Proof of concept** (code sample or demo URL)
- **Potential impact** (what an attacker could do)
- **Suggested fix** (if you have one)

**Example report:**
```markdown
**Vulnerability Type:** Cross-Site Scripting (XSS)

**Affected Component:** pan-markdown-editor v1.1.0

**Description:**
User-supplied markdown content is not properly sanitized before rendering,
allowing arbitrary JavaScript execution.

**Reproduction:**
1. Create a pan-markdown-editor component
2. Insert the following markdown: `[Click me](javascript:alert('XSS'))`
3. Click the rendered link
4. JavaScript executes

**Impact:**
An attacker could inject malicious scripts into markdown content, potentially
stealing user credentials or performing actions on behalf of users.

**Suggested Fix:**
Use DOMPurify or similar library to sanitize HTML output from markdown parser.
```

### 3. Response Timeline

We aim to respond to security reports according to this timeline:

| Timeframe | Action |
|-----------|--------|
| Within 24 hours | Initial acknowledgment of report |
| Within 3 business days | Preliminary assessment and severity rating |
| Within 7 days | Detailed response with action plan |
| Within 30 days | Fix developed, tested, and released (for critical vulnerabilities) |
| Within 90 days | Fix developed, tested, and released (for non-critical vulnerabilities) |

### 4. Disclosure Policy

We follow **coordinated disclosure**:

- We will work with you to understand and fix the vulnerability
- We will keep you informed of our progress
- We will credit you in the security advisory (unless you prefer anonymity)
- We ask that you do not publicly disclose the vulnerability until we have released a fix
- We will publicly disclose the vulnerability after a fix is released

**Typical timeline:**
1. **Day 0:** Vulnerability reported privately
2. **Day 1-3:** Acknowledged and assessed
3. **Day 3-30:** Fix developed and tested
4. **Day 30:** Security release published
5. **Day 30+:** Public disclosure with credit to reporter

---

## Security Considerations for LARC Users

### Browser Security

LARC runs in the browser and relies on browser security features:

**Content Security Policy (CSP):**
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://unpkg.com/@larcjs/;
               style-src 'self' 'unsafe-inline';">
```

**Subresource Integrity (SRI):**
```html
<script type="module"
        src="https://unpkg.com/@larcjs/core@1.1.1/src/pan.mjs"
        integrity="sha384-..."
        crossorigin="anonymous"></script>
```

### Message Bus Security

**Topic validation:**
- Topic names are validated to prevent injection
- Wildcards are restricted (no global wildcards by default)
- Message payloads are not executed as code

**Rate limiting:**
- Built-in rate limiting prevents message flooding
- Configurable via `rate-limit` attribute on `<pan-bus>`

**Example:**
```html
<pan-bus
  rate-limit="1000"
  allow-global-wildcard="false"
  max-message-size="1048576"></pan-bus>
```

### Component Security

**XSS Prevention:**
- Always sanitize user input before rendering
- Use Shadow DOM for encapsulation
- Avoid `innerHTML` with user-provided content

**Example (safe):**
```javascript
// Good - using textContent
element.textContent = userInput;

// Good - sanitizing HTML
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// Bad - direct innerHTML with user input
element.innerHTML = userInput; // ❌ XSS vulnerability
```

**Attribute injection:**
- Validate attribute values
- Sanitize before using in DOM manipulation

### State Management Security

**localStorage/sessionStorage:**
- Never store sensitive data (passwords, tokens) in localStorage
- Use httpOnly cookies for authentication tokens
- Encrypt sensitive data before persisting

**Example:**
```javascript
// Bad - storing sensitive data
localStorage.setItem('authToken', token); // ❌

// Good - using secure cookies (set by server)
// Set-Cookie: authToken=...; HttpOnly; Secure; SameSite=Strict
```

### Third-Party Components

If you create LARC components:
- Audit dependencies for vulnerabilities
- Use npm audit regularly
- Pin dependency versions
- Follow OWASP security guidelines

---

## Known Security Considerations

### 1. Message Bus Access

**Consideration:** All components on a page can publish/subscribe to the PAN bus.

**Mitigation:**
- Use topic namespacing to isolate components
- Validate message sources in sensitive handlers
- Don't put sensitive data in PAN messages

### 2. Dynamic Component Loading

**Consideration:** The autoloader dynamically imports JavaScript modules.

**Mitigation:**
- Only load components from trusted sources
- Use Subresource Integrity (SRI) for CDN components
- Configure CSP to restrict script sources
- Use `resolveComponent` to validate component paths

**Example:**
```javascript
window.panAutoload = {
  resolveComponent: (tag) => {
    // Whitelist allowed components
    const allowed = ['pan-card', 'pan-button', 'pan-table'];
    if (!allowed.includes(tag)) {
      throw new Error(`Component ${tag} not allowed`);
    }
    return `/components/${tag}.mjs`;
  }
};
```

### 3. Shadow DOM Encapsulation

**Consideration:** Shadow DOM provides style encapsulation but not security isolation.

**Mitigation:**
- Don't rely on Shadow DOM for security boundaries
- Still validate and sanitize inputs
- Use proper authentication/authorization

---

## Security Best Practices for Contributors

When contributing to LARC:

1. **Never commit secrets:**
   - API keys, tokens, passwords
   - Use environment variables or secure vaults

2. **Validate all inputs:**
   - User-provided data
   - Attribute values
   - Message payloads

3. **Sanitize outputs:**
   - HTML rendering
   - URL construction
   - DOM manipulation

4. **Review dependencies:**
   - Run `npm audit` before committing
   - Update vulnerable dependencies
   - Use minimal dependencies

5. **Write secure tests:**
   - Test input validation
   - Test XSS prevention
   - Test authorization checks

---

## Security Audit History

| Date | Version | Audit Type | Findings |
|------|---------|------------|----------|
| 2024-11-24 | 1.1.0 | npm audit | 0 critical, 0 high |
| 2024-11-XX | 1.0.2 | npm audit | 0 critical, 0 high |

---

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [MDN Security Best Practices](https://developer.mozilla.org/en-US/docs/Web/Security)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)

---

## Contact

For security concerns or questions:
- GitHub Security Advisories: https://github.com/larcjs/core/security/advisories
- GitHub Discussions (mark as Security): https://github.com/larcjs/core/discussions

---

**Thank you for helping keep LARC and its users safe!** 🔒
