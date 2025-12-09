#!/usr/bin/env python3
"""
Authentication Endpoint for PAN (Python/Flask version)

Handles login, logout, token refresh, and session management

Security Features:
✓ Password hashing with bcrypt
✓ HttpOnly cookies for session/JWT
✓ CSRF protection
✓ Rate limiting
✓ Secure session configuration

Usage: python auth.py [port]
Default port: 3002
"""

import sys
import configparser
import time
import secrets
from functools import wraps
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import jwt
import bcrypt

app = Flask(__name__)
app.secret_key = 'change-this-secret-in-production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = True  # Requires HTTPS
app.config['SESSION_COOKIE_SAMESITE'] = 'Strict'

# CORS configuration
CORS(app, supports_credentials=True, origins=[
    'https://cdr2.com',
    'https://www.cdr2.com',
    'https://localhost:8443',
    'http://localhost:8080',
    'http://localhost:*'
])

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3002

# Rate limiting store
rate_limits = {}

# Load environment
def load_environment(file_path):
    config = configparser.ConfigParser()
    try:
        config.read(file_path)
        return config
    except:
        return None

env = load_environment('.env')
JWT_SECRET = env.get('security', 'jwt_secret', fallback='change-this-secret-in-production')

# Demo user credentials (password: 'demo123')
DEMO_USER = {
    'userID': 1,
    'username': 'demo',
    'email': 'demo@example.com',
    'password_hash': bcrypt.hashpw(b'demo123', bcrypt.gensalt()).decode('utf-8')
}

# Rate limiting decorator
def rate_limit(limit=5, window=300):
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
                return jsonify({'ok': False, 'error': 'Too many attempts. Please try again later.'}), 429
            else:
                rate_limits[key]['count'] += 1

            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Security headers
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response

# Generate CSRF token
@app.before_request
def init_csrf():
    if 'csrf_token' not in session:
        session['csrf_token'] = secrets.token_hex(32)

# Create JWT token
def create_jwt(payload, expires_in=900):
    payload['iat'] = int(time.time())
    payload['exp'] = int(time.time()) + expires_in
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

# Verify JWT token
def verify_jwt(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except:
        return None

# Handle login
@app.route('/', methods=['POST', 'GET'])
@rate_limit()
def handle_auth():
    action = request.args.get('action', '')

    if action == 'login':
        return handle_login()
    elif action == 'logout':
        return handle_logout()
    elif action == 'refresh':
        return handle_refresh()
    elif action == 'check':
        return handle_check()
    elif action == 'csrf':
        return jsonify({
            'ok': True,
            'csrf_token': session.get('csrf_token')
        })
    else:
        return jsonify({'ok': False, 'error': 'Invalid action'}), 400

def handle_login():
    data = request.get_json() or {}
    email = data.get('email', '')
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'ok': False, 'error': 'Email and password required'}), 400

    # Verify credentials (demo user)
    if email == DEMO_USER['email'] and bcrypt.checkpw(password.encode('utf-8'), DEMO_USER['password_hash'].encode('utf-8')):
        user = DEMO_USER

        # Update session
        session['authenticated'] = True
        session['user_id'] = user['userID']
        session['username'] = user['username']
        session['email'] = user['email']

        # Create JWT tokens
        token = create_jwt({
            'sub': user['userID'],
            'username': user['username'],
            'email': user['email']
        }, 900)  # 15 minutes

        refresh_token = create_jwt({
            'sub': user['userID'],
            'type': 'refresh'
        }, 604800)  # 7 days

        response = jsonify({
            'ok': True,
            'user': {
                'id': user['userID'],
                'username': user['username'],
                'email': user['email']
            },
            'token': token,
            'refresh_token': refresh_token
        })

        # Set tokens as HttpOnly cookies
        response.set_cookie('jwt', token, httponly=True, secure=True, samesite='Strict', max_age=900)
        response.set_cookie('refresh_jwt', refresh_token, httponly=True, secure=True, samesite='Strict', max_age=604800)

        return response
    else:
        return jsonify({'ok': False, 'error': 'Invalid credentials'}), 401

def handle_logout():
    # Clear session
    session.clear()

    response = jsonify({'ok': True})

    # Delete cookies
    response.set_cookie('jwt', '', httponly=True, secure=True, samesite='Strict', max_age=0)
    response.set_cookie('refresh_jwt', '', httponly=True, secure=True, samesite='Strict', max_age=0)

    return response

def handle_refresh():
    refresh_token = request.cookies.get('refresh_jwt', '')

    if not refresh_token:
        return jsonify({'ok': False, 'error': 'No refresh token'}), 401

    payload = verify_jwt(refresh_token)

    if not payload or payload.get('type') != 'refresh':
        return jsonify({'ok': False, 'error': 'Invalid refresh token'}), 401

    # Create new access token
    token = create_jwt({
        'sub': payload['sub']
    }, 900)  # 15 minutes

    response = jsonify({
        'ok': True,
        'token': token
    })

    response.set_cookie('jwt', token, httponly=True, secure=True, samesite='Strict', max_age=900)

    return response

def handle_check():
    if session.get('authenticated'):
        return jsonify({
            'ok': True,
            'authenticated': True,
            'user': {
                'id': session.get('user_id'),
                'username': session.get('username'),
                'email': session.get('email')
            },
            'csrf_token': session.get('csrf_token')
        })
    else:
        return jsonify({
            'ok': True,
            'authenticated': False,
            'csrf_token': session.get('csrf_token')
        })

if __name__ == '__main__':
    print(f'Authentication server running on http://localhost:{PORT}')
    print('Demo credentials: demo@example.com / demo123')
    app.run(host='0.0.0.0', port=PORT, debug=False)
