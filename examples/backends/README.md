# LARC/PAN Backend Examples

Backend API implementations for LARC/PAN in multiple languages. Choose the language you're most comfortable with!

## Available Languages

### 📦 PHP (Recommended for Examples)
**Location:** `backends/php/`

PHP backends are recommended for the examples because they run directly with PHP's built-in server without requiring a separate process. Perfect for quick prototyping and learning.

- ✅ No separate server process needed
- ✅ Works with `php -S localhost:8000`
- ✅ Commonly available on shared hosting
- ✅ Simple deployment

**[View PHP Documentation →](php/)**

### 🟢 Node.js
**Location:** `backends/nodejs/`

Modern JavaScript backend implementations using native Node.js HTTP server (no Express). Great for JavaScript developers who want to keep everything in one language.

- ✅ Same language as frontend
- ✅ Non-blocking I/O
- ✅ Rich npm ecosystem
- ✅ Great for real-time apps

**[View Node.js Documentation →](nodejs/README.md)**

### 🐍 Python
**Location:** `backends/python/`

Flask-based implementations perfect for Python developers and data science workflows. Python's simplicity makes these backends very approachable for beginners.

- ✅ Extremely readable code
- ✅ Built-in SQLite support
- ✅ Flask is lightweight and simple
- ✅ Great for data-driven apps

**[View Python Documentation →](python/README.md)**

## Backend APIs

Each language implements the same set of APIs:

### 1. **Legacy API** (Simple Database API)
- Port: 3000
- No authentication
- List resources, get data, describe tables
- Perfect for getting started

### 2. **Secure API** (Production-Ready)
- Port: 3001
- Authentication required
- CSRF protection, rate limiting
- Resource whitelisting
- Security headers

### 3. **Authentication API**
- Port: 3002
- JWT token-based auth
- Login, logout, refresh, check status
- Demo credentials provided

### 4. **SSE Server** (Real-Time Events)
- Port: 3003
- Server-Sent Events for PAN messaging
- Subscribe to topics with wildcards
- Publish and broadcast events
- File-backed persistence

## Quick Start

### PHP
```bash
cd backends/php
php -S localhost:3000 api-legacy.php
```

### Node.js
```bash
cd backends/nodejs
npm install
npm run all  # Runs all servers
```

### Python
```bash
cd backends/python
pip install -r requirements.txt
python3 api-legacy.py
```

## Database Configuration

All backends share the same `.env` configuration format:

```ini
[db]
type=mysql          # or sqlite
host=localhost
user=root
pass=
db=test

# For SQLite
# type=sqlite
# file=pan_demo.db

[demo]
mode=true

[security]
jwt_secret=change-this-secret-in-production
```

## Which Language Should You Choose?

### Choose PHP if:
- You're running the examples for learning
- You want the simplest setup
- You have shared hosting
- You don't want to manage server processes

### Choose Node.js if:
- You're already using JavaScript for frontend
- You want non-blocking I/O
- You're building real-time applications
- You prefer the npm ecosystem

### Choose Python if:
- You're a Python developer
- You're working with data science/ML
- You want the most readable code
- You're building data-driven applications

## Feature Comparison

| Feature | PHP | Node.js | Python |
|---------|-----|---------|--------|
| **Setup Simplicity** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Built-in Server** | ✓ | ✓ | ✓ (dev) |
| **MySQL Support** | ✓ | ✓ | ✓ |
| **SQLite Support** | ✓ | ✓ | ✓ (built-in) |
| **Shared Hosting** | ✓ | Limited | Limited |
| **Real-time** | ✓ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Async/Await** | ✓ | ✓ (native) | ✓ |
| **Type Safety** | ✓ (8.0+) | ✓ (TypeScript) | ✓ (type hints) |

## Example HTML Files

The HTML examples in the parent directory use **PHP backends by default** because they're the easiest to get started with. To use Node.js or Python backends instead, simply change the API URLs in the HTML files:

```javascript
// Default (PHP)
const API_URL = 'api.php';

// Node.js
const API_URL = 'http://localhost:3001/';

// Python
const API_URL = 'http://localhost:3001/';
```

## Production Deployment

### PHP
```bash
# With Apache/Nginx + PHP-FPM
# Or use PHP's built-in server (dev only)
php -S 0.0.0.0:8000 api.php
```

### Node.js
```bash
# With PM2
npm install -g pm2
pm2 start api.js --name "larc-api"
```

### Python
```bash
# With Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:3000 api-legacy:app
```

## Security Notes

⚠️ **Important:** These examples are configured for **development** use. Before deploying to production:

1. Change all secrets and JWT keys
2. Disable demo mode
3. Use HTTPS everywhere
4. Configure proper CORS origins
5. Set up proper database authentication
6. Enable logging and monitoring
7. Use environment variables (not `.env` files)
8. Review and harden security settings

## Contributing

When adding new backend functionality:

1. Implement in PHP first (as the reference)
2. Port to Node.js and Python
3. Ensure consistent API interfaces
4. Update all three README files
5. Test with the example HTML files

## License

MIT © LARC Contributors
