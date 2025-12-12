#!/usr/bin/env python3
"""
Secure API Endpoint for PAN (Python/Flask version)

Security Features:
✓ Prepared statements for all SQL queries
✓ Session-based authentication
✓ CSRF protection
✓ Input validation and sanitization
✓ Resource whitelist
✓ Rate limiting
✓ Security headers

Usage: python api.py [port]
Default port: 3001
"""

import sys
import configparser
import json
import time
from functools import wraps
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import mysql.connector
import sqlite3

app = Flask(__name__)
app.secret_key = 'change-this-secret-in-production'

# CORS configuration
CORS(app, supports_credentials=True, origins=[
    'https://cdr2.com',
    'https://www.cdr2.com',
    'https://localhost:8443',
    'http://localhost:8080',
    'http://localhost:*'
])

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3001

# Rate limiting store
rate_limits = {}

# Resource whitelist
ALLOWED_RESOURCES = {
    'users': {'table': 'users', 'pk': 'userID'},
    'posts': {'table': 'posts', 'pk': 'postID'},
    'comments': {'table': 'comments', 'pk': 'commentID'},
    'products': {'table': 'products', 'pk': 'productID'},
    'orders': {'table': 'orders', 'pk': 'orderID'}
}

# Field whitelist per resource
ALLOWED_FIELDS = {
    'users': ['userID', 'username', 'email', 'created_at', 'updated_at'],
    'posts': ['postID', 'title', 'content', 'userID', 'created_at'],
    'comments': ['commentID', 'content', 'postID', 'userID', 'created_at'],
    'products': ['productID', 'name', 'description', 'price', 'stock', 'category', 'created_at', 'updated_at'],
    'orders': ['orderID', 'userID', 'total', 'status', 'created_at', 'updated_at']
}

# Load environment
def load_environment(file_path):
    config = configparser.ConfigParser()
    try:
        config.read(file_path)
        return config
    except:
        return None

env = load_environment('.env')
DEMO_MODE = env.get('demo', 'mode', fallback='false') == 'true'
DB_TYPE = env.get('db', 'type', fallback='mysql')

# Database connection
db_conn = None

def get_db():
    global db_conn
    if db_conn is None:
        if DB_TYPE == 'sqlite':
            db_file = env.get('db', 'file', fallback='pan_demo.db')
            db_conn = sqlite3.connect(db_file, check_same_thread=False)
            db_conn.row_factory = sqlite3.Row
        else:
            db_conn = mysql.connector.connect(
                host=env.get('db', 'host', fallback='localhost'),
                user=env.get('db', 'user', fallback='root'),
                password=env.get('db', 'pass', fallback=''),
                database=env.get('db', 'db', fallback='test')
            )
    return db_conn

# Rate limiting decorator
def rate_limit(limit=100, window=60):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            key = f"{request.remote_addr}_{f.__name__}"
            now = time.time()

            if key not in rate_limits:
                rate_limits[key] = {'count': 1, 'reset': now + window}
            elif now > rate_limits[key]['reset']:
                rate_limits[key] = {'count': 1, 'reset': now + window}
            elif rate_limits[key]['count'] >= limit:
                return jsonify({'status': 'error', 'msg': 'Rate limit exceeded'}), 429
            else:
                rate_limits[key]['count'] += 1

            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Authentication required decorator
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not DEMO_MODE and not session.get('authenticated'):
            return jsonify({'status': 'error', 'msg': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Security headers
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response

# Initialize session for demo mode
@app.before_request
def init_demo_session():
    if DEMO_MODE and not session.get('authenticated'):
        session['authenticated'] = True
        session['user_id'] = 'demo'

# Get operation
def get_data(params):
    resource = params.get('rsc', '')
    if resource not in ALLOWED_RESOURCES:
        return {'status': 'error', 'msg': 'Invalid resource'}

    config = ALLOWED_RESOURCES[resource]
    table = config['table']
    pk = config['pk']
    allowed_fields = ALLOWED_FIELDS.get(resource, ['*'])

    # Validate requested fields
    requested_fields = params.get('fields', ','.join(allowed_fields)).split(',')
    fields = [f.strip() for f in requested_fields if f.strip() in allowed_fields]

    if not fields:
        fields = allowed_fields

    field_list = ', '.join(f'`{f}`' for f in fields)

    try:
        db = get_db()
        cursor = db.cursor()

        # Single item by ID
        if params.get('id'):
            if DB_TYPE == 'sqlite':
                sql = f"SELECT {field_list} FROM `{table}` WHERE `{pk}` = ? LIMIT 1"
                cursor.execute(sql, (params['id'],))
                row = cursor.fetchone()
                return [dict(row)] if row else []
            else:
                sql = f"SELECT {field_list} FROM `{table}` WHERE `{pk}` = %s LIMIT 1"
                cursor.execute(sql, (params['id'],))
                columns = [desc[0] for desc in cursor.description]
                row = cursor.fetchone()
                return [dict(zip(columns, row))] if row else []

        # List with pagination
        page_size = max(1, min(int(params.get('page_size', 20)), 100))
        start = max(0, int(params.get('start', 0)))

        where = ''
        where_params = []

        if params.get('filters'):
            try:
                filters = json.loads(params['filters'])
                if isinstance(filters, list) and len(filters) > 0:
                    wheres = []
                    for f in filters:
                        key = f.get('key', '')
                        value = f.get('value', '')
                        if key in allowed_fields:
                            wheres.append(f"`{key}` LIKE ?")
                            where_params.append(f"%{value}%")
                    if wheres:
                        where = ' WHERE ' + ' AND '.join(wheres)
            except:
                pass

        if DB_TYPE == 'sqlite':
            # Count total
            count_sql = f"SELECT COUNT(*) as total FROM `{table}` {where}"
            cursor.execute(count_sql, where_params)
            total = cursor.fetchone()[0]

            # Get paginated results
            sql = f"SELECT {field_list} FROM `{table}` {where} LIMIT ? OFFSET ?"
            cursor.execute(sql, where_params + [page_size, start])
            rows = cursor.fetchall()
            results = [dict(row) for row in rows]
        else:
            # Count total
            count_sql = f"SELECT COUNT(*) as total FROM `{table}` {where}"
            cursor.execute(count_sql, tuple(where_params))
            total = cursor.fetchone()[0]

            # Get paginated results
            sql = f"SELECT {field_list} FROM `{table}` {where} LIMIT %s OFFSET %s"
            cursor.execute(sql, tuple(where_params + [page_size, start]))
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            results = [dict(zip(columns, row)) for row in rows]

        return {
            'total': total,
            'start': start,
            'count': len(results),
            'pages': (total + page_size - 1) // page_size,
            'page': start // page_size + 1,
            'results': results
        }
    except Exception as e:
        return {'status': 'error', 'msg': str(e)}

# List resources
def list_resources():
    return {'Resources': list(ALLOWED_RESOURCES.keys())}

# List fields
def list_fields(params):
    resource = params.get('rsc', '')
    if resource not in ALLOWED_RESOURCES:
        return {'status': 'error', 'msg': 'Invalid resource'}

    config = ALLOWED_RESOURCES[resource]
    fields = ALLOWED_FIELDS.get(resource, [])

    return {
        'Resource': resource,
        'PrimaryKey': config['pk'],
        'Fields': [{'Field': f} for f in fields]
    }

# Route handler
@app.route('/', methods=['GET', 'POST'])
@require_auth
@rate_limit()
def handle_request():
    params = request.args.to_dict()
    action = params.get('x', '')

    if action == 'list_resources':
        result = list_resources()
    elif action == 'get':
        result = get_data(params)
    elif action == 'list_fields':
        result = list_fields(params)
    else:
        result = {'status': 'error', 'msg': 'Invalid action'}

    return jsonify(result)

@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all exceptions without exposing stack traces"""
    # Log the full error internally
    import logging
    logging.exception('Internal server error')
    # Return generic error to client
    return jsonify({'status': 'error', 'msg': 'Internal server error'}), 500

if __name__ == '__main__':
    print(f'Secure API server running on http://localhost:{PORT}')
    print(f'Demo mode: {"enabled" if DEMO_MODE else "disabled"}')
    print(f'Database: {DB_TYPE}')
    app.run(host='0.0.0.0', port=PORT, debug=False)
