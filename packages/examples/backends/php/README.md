# PHP Backend Examples for LARC/PAN

PHP backend implementations for LARC/PAN examples. These are the **recommended backends for the examples** because they run directly with PHP's built-in server without requiring a separate process.

## Why PHP for Examples?

- ✅ **No separate server needed** - Runs with `php -S`
- ✅ **Widely available** - Pre-installed on many systems
- ✅ **Simple deployment** - Works on shared hosting
- ✅ **No build step** - Just edit and refresh

## Available Backends

All backends are identical in functionality to the Node.js and Python versions.

### 1. Legacy API (`api-legacy.php`)
Simple database API with basic CRUD operations.

### 2. Secure API (`apps/api.php`)
Production-ready API with authentication, CSRF, rate limiting.

### 3. Authentication (`auth.php`)
JWT-based authentication endpoint.

### 4. SSE Server (`sse.php`)
Server-Sent Events hub for real-time messaging.

## Quick Start

```bash
# Run legacy API
php -S localhost:3000 api-legacy.php

# Run secure API
php -S localhost:3001 apps/api.php

# Run authentication
php -S localhost:3002 auth.php

# Run SSE server
php -S localhost:3003 sse.php
```

## Configuration

Create a `.env` file:

```ini
[db]
type=mysql
host=localhost
user=root
pass=
db=test

[demo]
mode=true

[security]
jwt_secret=change-this-secret-in-production
```

## Database Support

- **MySQL** via `mysqli`
- **SQLite** via PDO

## Requirements

- PHP 7.4+ (8.0+ recommended)
- mysqli extension (for MySQL)
- PDO extension (for SQLite)

## Production Deployment

For production, use Apache or Nginx with PHP-FPM instead of the built-in server:

### Apache
```apache
<VirtualHost *:80>
    ServerName api.example.com
    DocumentRoot /path/to/backends/php

    <Directory /path/to/backends/php>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### Nginx
```nginx
server {
    listen 80;
    server_name api.example.com;
    root /path/to/backends/php;

    location / {
        try_files $uri $uri/ /api.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## Security

The provided examples include security features but are configured for development. For production:

- Change JWT secret
- Disable demo mode
- Use HTTPS
- Configure proper CORS
- Set up database authentication
- Enable error logging
- Review security headers

## License

MIT © LARC Contributors
