# Node.js Backend Examples for LARC/PAN

This directory contains Node.js versions of the PHP backend examples, making it easier to get started with LARC without requiring PHP.

## Available Backends

### 1. Legacy API (`api-legacy.js`)
Simple database API with basic CRUD operations. No authentication required.

**Port:** 3000
**Endpoints:**
- `GET /?x=list_resources` - List available database tables
- `GET /?x=get&rsc=tablename` - Get records from a table (with pagination)
- `GET /?x=list_fields&rsc=tablename` - Get table schema

### 2. Secure API (`apps/api.js`)
Production-ready API with security features.

**Port:** 3001
**Features:**
- Session-based authentication
- CSRF protection
- Rate limiting
- Resource whitelisting
- SQL injection protection
- Security headers

**Endpoints:** Same as Legacy API, but requires authentication

### 3. Authentication (`auth.js`)
Handles user authentication with JWT tokens.

**Port:** 3002
**Endpoints:**
- `GET /?action=login` - User login (returns JWT)
- `GET /?action=logout` - User logout
- `GET /?action=refresh` - Refresh JWT token
- `GET /?action=check` - Check authentication status
- `GET /?action=csrf` - Get CSRF token

**Demo Credentials:**
- Email: `demo@example.com`
- Password: `demo123`

### 4. SSE Server (`sse.js`)
Server-Sent Events hub for real-time PAN messaging.

**Port:** 3003
**Endpoints:**
- `GET /?topics=topic1,topic2&lastEventId=123` - Subscribe to event stream
- `POST /` with `{"topic": "demo.ping", "data": {...}, "retain": false}` - Publish event

## Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

## Usage

### Run Individual Servers

```bash
# Legacy API
npm run api-legacy

# Secure API
npm run api

# Authentication
npm run auth

# SSE Server
npm run sse
```

### Run All Servers Concurrently

```bash
npm run backends
```

This will start all four servers on their respective ports:
- Legacy API: http://localhost:3000
- Secure API: http://localhost:3001
- Auth: http://localhost:3002
- SSE: http://localhost:3003

## Configuration

Create a `.env` file in this directory with your database settings:

```ini
[db]
type=mysql
host=localhost
user=root
pass=
db=test

# For SQLite (optional)
# type=sqlite
# file=pan_demo.db

[demo]
mode=true

[security]
jwt_secret=change-this-secret-in-production
```

## Database Support

Both **MySQL** and **SQLite** are supported:

- **MySQL**: Use the `mysql2` package (already included)
- **SQLite**: Use the `better-sqlite3` package (already included)

Set the database type in your `.env` file.

## Security Notes

### Development vs Production

The examples are configured for **development** use. For production:

1. **Change the JWT secret** in `.env`
2. **Disable demo mode** (`demo.mode=false`)
3. **Use HTTPS** for all endpoints
4. **Configure proper CORS** origins in each file
5. **Set up proper database authentication**
6. **Use environment variables** instead of `.env` file
7. **Enable proper logging** and monitoring

### Password Hashing

The authentication server uses `bcryptjs` for password hashing. The demo password is pre-hashed for convenience.

## Comparison with PHP Versions

| Feature | PHP Version | Node.js Version |
|---------|-------------|-----------------|
| No build step | ✓ | ✓ |
| MySQL support | ✓ | ✓ |
| SQLite support | ✓ (PDO) | ✓ (better-sqlite3) |
| Sessions | ✓ (built-in) | ✓ (in-memory Map) |
| CSRF protection | ✓ | ✓ |
| Rate limiting | ✓ | ✓ |
| JWT support | ✓ (manual) | ✓ (crypto) |
| SSE | ✓ (file-based) | ✓ (file-based + in-memory) |

## Examples

### Fetch Resources

```javascript
// Get list of available resources
const response = await fetch('http://localhost:3000/?x=list_resources');
const data = await response.json();
console.log(data.Resources);
```

### Get Data with Pagination

```javascript
// Get first 10 products
const response = await fetch('http://localhost:3000/?x=get&rsc=products&page_size=10&start=0');
const data = await response.json();
console.log(data.results);
```

### Authenticate

```javascript
// Login
const response = await fetch('http://localhost:3002/?action=login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'demo@example.com',
    password: 'demo123'
  })
});
const data = await response.json();
console.log(data.token);
```

### Subscribe to SSE

```javascript
const events = new EventSource('http://localhost:3003/?topics=demo.*');

events.addEventListener('demo.ping', (e) => {
  const data = JSON.parse(e.data);
  console.log('Received:', data);
});
```

### Publish SSE Event

```javascript
await fetch('http://localhost:3003/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'demo.ping',
    data: { message: 'Hello from Node.js!' },
    retain: false
  })
});
```

## Troubleshooting

### Port Already in Use

If you get an "EADDRINUSE" error, another process is using the port. Either:
1. Stop the other process
2. Pass a different port: `node api-legacy.js 3010`

### Database Connection Errors

- Check your `.env` configuration
- Ensure MySQL is running (if using MySQL)
- Verify database credentials
- Create the database if it doesn't exist

### Module Not Found

Run `npm install` to install all dependencies.

## License

MIT © LARC Contributors
