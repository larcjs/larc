# Python Backend Examples for LARC/PAN

Flask-based backend implementations for LARC/PAN examples, providing an alternative to PHP for Python developers.

## Available Backends

### 1. Legacy API (`api-legacy.py`)
Simple database API with basic CRUD operations. No authentication required.

**Port:** 3000
**Endpoints:**
- `GET /?x=list_resources` - List available database tables
- `GET /?x=get&rsc=tablename` - Get records from a table (with pagination)
- `GET /?x=list_fields&rsc=tablename` - Get table schema

### 2. Secure API (`apps/api.py`)
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

### 3. Authentication (`auth.py`)
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

### 4. SSE Server (`sse.py`)
Server-Sent Events hub for real-time PAN messaging.

**Port:** 3003
**Endpoints:**
- `GET /?topics=topic1,topic2&lastEventId=123` - Subscribe to event stream
- `POST /` with `{"topic": "demo.ping", "data": {...}, "retain": false}` - Publish event

## Installation

### Using pip

```bash
# Install dependencies
pip install -r requirements.txt

# Or with specific Python version
python3 -m pip install -r requirements.txt
```

### Using virtual environment (recommended)

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt
```

## Usage

### Run Individual Servers

```bash
# Legacy API
python3 api-legacy.py

# Secure API
python3 apps/api.py

# Authentication
python3 auth.py

# SSE Server
python3 sse.py
```

### Make Files Executable (Optional)

```bash
chmod +x api-legacy.py auth.py sse.py apps/api.py

# Then run directly
./api-legacy.py
```

### Custom Ports

```bash
# Pass port as argument
python3 api-legacy.py 8000
python3 auth.py 8002
```

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

- **MySQL**: Uses `mysql-connector-python` package
- **SQLite**: Uses built-in `sqlite3` module (no extra package needed!)

Set the database type in your `.env` file.

## Dependencies

- **Flask** (3.0.0+) - Lightweight web framework
- **Flask-CORS** (4.0.0+) - CORS support
- **PyJWT** (2.8.0+) - JWT token encoding/decoding
- **bcrypt** (4.1.2+) - Password hashing
- **mysql-connector-python** (8.2.0+) - MySQL database driver

## Security Notes

### Development vs Production

The examples are configured for **development** use. For production:

1. **Change the JWT secret** in `.env`
2. **Use a proper secret key** for Flask (`app.secret_key`)
3. **Disable demo mode** (`demo.mode=false`)
4. **Use HTTPS** for all endpoints
5. **Configure proper CORS** origins in each file
6. **Set up proper database authentication**
7. **Use environment variables** instead of `.env` file
8. **Enable proper logging** and monitoring
9. **Use a production WSGI server** (Gunicorn, uWSGI, etc.)

### Running in Production

```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn (example)
gunicorn -w 4 -b 0.0.0.0:3000 api-legacy:app
```

## Examples

### Fetch Resources

```python
import requests

# Get list of available resources
response = requests.get('http://localhost:3000/?x=list_resources')
data = response.json()
print(data['Resources'])
```

### Get Data with Pagination

```python
import requests

# Get first 10 products
response = requests.get('http://localhost:3000/', params={
    'x': 'get',
    'rsc': 'products',
    'page_size': 10,
    'start': 0
})
data = response.json()
print(data['results'])
```

### Authenticate

```python
import requests

# Login
response = requests.post('http://localhost:3002/?action=login', json={
    'email': 'demo@example.com',
    'password': 'demo123'
})
data = response.json()
print(data['token'])
```

### Subscribe to SSE

```python
import requests

url = 'http://localhost:3003/?topics=demo.*'
headers = {'Accept': 'text/event-stream'}

with requests.get(url, headers=headers, stream=True) as response:
    for line in response.iter_lines():
        if line:
            print(line.decode('utf-8'))
```

### Publish SSE Event

```python
import requests

requests.post('http://localhost:3003/', json={
    'topic': 'demo.ping',
    'data': {'message': 'Hello from Python!'},
    'retain': False
})
```

## Troubleshooting

### Port Already in Use

If you get an "Address already in use" error, either:
1. Stop the other process
2. Pass a different port: `python3 api-legacy.py 3010`

### Database Connection Errors

- Check your `.env` configuration
- Ensure MySQL is running (if using MySQL)
- Verify database credentials
- Create the database if it doesn't exist

### Module Not Found

Run `pip install -r requirements.txt` to install all dependencies.

### Permission Denied (Executable)

```bash
chmod +x api-legacy.py auth.py sse.py apps/api.py
```

## Comparison with Node.js/PHP Versions

| Feature | PHP | Node.js | Python |
|---------|-----|---------|--------|
| No build step | ✓ | ✓ | ✓ |
| Built-in server | ✓ (with PHP-FPM) | ✓ | ✓ (Flask dev server) |
| MySQL support | ✓ | ✓ | ✓ |
| SQLite support | ✓ | ✓ | ✓ (built-in) |
| Production WSGI | ✓ (PHP-FPM) | ✓ (PM2/cluster) | ✓ (Gunicorn/uWSGI) |
| Package manager | Composer | npm | pip |

## Why Python?

- **Beginner-friendly** - Often the first language people learn
- **Excellent web frameworks** - Flask, FastAPI, Django
- **Strong in data science** - Natural fit for data-driven apps
- **Built-in SQLite** - No extra database driver needed
- **Rich ecosystem** - Extensive library support

## License

MIT © LARC Contributors
