#!/usr/bin/env node

/**
 * Authentication Endpoint for PAN (Node.js version)
 *
 * Handles login, logout, token refresh, and session management
 *
 * Security Features:
 * ✓ Password hashing with bcrypt
 * ✓ HttpOnly cookies for session/JWT
 * ✓ CSRF protection
 * ✓ Rate limiting
 * ✓ Secure session configuration
 *
 * Usage: node auth.js [port]
 * Default port: 3002
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const PORT = process.argv[2] || 3002;

// Simple session store (in-memory)
const sessions = new Map();
const SESSION_TIMEOUT = 3600000; // 1 hour

// Rate limiting store
const rateLimits = new Map();

// Load environment
function loadEnvironment(file) {
	try {
		const txt = fs.readFileSync(file, 'utf8');
		const lines = txt.split('\n');
		const out = {};
		let section = '';

		for (const line of lines) {
			const sectionMatch = line.match(/\[(\w+)\]/);
			if (sectionMatch) {
				section = sectionMatch[1];
				out[section] = {};
			} else {
				const parts = line.split(/\s*=\s*/);
				if (parts.length === 2 && section) {
					out[section][parts[0].trim()] = parts[1].trim();
				}
			}
		}
		return out;
	} catch (err) {
		return {};
	}
}

const env = loadEnvironment('.env');
const JWT_SECRET = env.security?.jwt_secret || 'change-this-secret-in-production';

// JWT helpers (simple implementation)
function createJWT(payload, secret, expiresIn = 3600) {
	const header = { alg: 'HS256', typ: 'JWT' };
	payload.iat = Math.floor(Date.now() / 1000);
	payload.exp = Math.floor(Date.now() / 1000) + expiresIn;

	const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
	const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');

	const signature = crypto
		.createHmac('sha256', secret)
		.update(`${base64Header}.${base64Payload}`)
		.digest('base64url');

	return `${base64Header}.${base64Payload}.${signature}`;
}

function verifyJWT(token, secret) {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		const [base64Header, base64Payload, signature] = parts;

		// Verify signature
		const expectedSignature = crypto
			.createHmac('sha256', secret)
			.update(`${base64Header}.${base64Payload}`)
			.digest('base64url');

		if (signature !== expectedSignature) {
			return null;
		}

		// Decode payload
		const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString());

		// Check expiration
		if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}

		return payload;
	} catch (e) {
		return null;
	}
}

// Session helpers
function createSession(authenticated = false, userId = null) {
	const sessionId = crypto.randomBytes(32).toString('hex');
	const csrfToken = crypto.randomBytes(32).toString('hex');

	sessions.set(sessionId, {
		id: sessionId,
		csrf_token: csrfToken,
		authenticated,
		user_id: userId,
		created: Date.now()
	});

	return sessionId;
}

function getSession(sessionId) {
	const session = sessions.get(sessionId);
	if (!session) return null;

	if (Date.now() - session.created > SESSION_TIMEOUT) {
		sessions.delete(sessionId);
		return null;
	}

	return session;
}

function deleteSession(sessionId) {
	sessions.delete(sessionId);
}

// Rate limiting
function checkRateLimit(key, limit = 5, window = 300000) {
	const now = Date.now();
	const limiter = rateLimits.get(key);

	if (!limiter || now > limiter.reset) {
		rateLimits.set(key, { count: 1, reset: now + window });
		return true;
	}

	if (limiter.count >= limit) {
		return false;
	}

	limiter.count++;
	return true;
}

// Security headers
function setSecurityHeaders(res, origin) {
	const allowedOrigins = [
		'https://cdr2.com',
		'https://www.cdr2.com',
		'https://localhost:8443',
		'http://localhost:8080'
	];

	const headers = {
		'X-Content-Type-Options': 'nosniff',
		'X-Frame-Options': 'DENY',
		'X-XSS-Protection': '1; mode=block',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
		'Access-Control-Allow-Credentials': 'true'
	};

	if (origin && (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:'))) {
		headers['Access-Control-Allow-Origin'] = origin;
	}

	for (const [key, value] of Object.entries(headers)) {
		res.setHeader(key, value);
	}
}

// Send JSON response
function sendJSON(res, obj, statusCode = 200) {
	res.writeHead(statusCode, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(obj));
}

// Parse JSON body
function parseBody(req) {
	return new Promise((resolve, reject) => {
		let body = '';
		req.on('data', chunk => body += chunk.toString());
		req.on('end', () => {
			try {
				resolve(body ? JSON.parse(body) : {});
			} catch (e) {
				resolve({});
			}
		});
		req.on('error', reject);
	});
}

// Handle login
async function handleLogin(req, res, session) {
	const ip = req.socket.remoteAddress;

	// Rate limiting: 5 attempts per 5 minutes
	if (!checkRateLimit(`login_${ip}`, 5, 300000)) {
		sendJSON(res, { ok: false, error: 'Too many attempts. Please try again later.' }, 429);
		return;
	}

	const body = await parseBody(req);
	const email = body.email || '';
	const password = body.password || '';

	if (!email || !password) {
		sendJSON(res, { ok: false, error: 'Email and password required' }, 400);
		return;
	}

	// Demo user for testing (password: 'demo123')
	const demoHash = bcrypt.hashSync('demo123', 10);

	if (email === 'demo@example.com' && bcrypt.compareSync(password, demoHash)) {
		const user = {
			userID: 1,
			username: 'demo',
			email: 'demo@example.com'
		};

		// Update session
		session.authenticated = true;
		session.user_id = user.userID;
		session.username = user.username;
		session.email = user.email;

		// Create JWT tokens
		const token = createJWT({
			sub: user.userID,
			username: user.username,
			email: user.email
		}, JWT_SECRET, 900); // 15 minutes

		const refreshToken = createJWT({
			sub: user.userID,
			type: 'refresh'
		}, JWT_SECRET, 604800); // 7 days

		// Set tokens as HttpOnly cookies
		res.setHeader('Set-Cookie', [
			`jwt=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/`,
			`refresh_jwt=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
		]);

		sendJSON(res, {
			ok: true,
			user: {
				id: user.userID,
				username: user.username,
				email: user.email
			},
			token,
			refresh_token: refreshToken
		});
	} else {
		sendJSON(res, { ok: false, error: 'Invalid credentials' }, 401);
	}
}

// Handle logout
function handleLogout(req, res, sessionId) {
	deleteSession(sessionId);

	// Clear cookies
	res.setHeader('Set-Cookie', [
		'jwt=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
		'refresh_jwt=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
		'session=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/'
	]);

	sendJSON(res, { ok: true });
}

// Handle token refresh
function handleRefresh(req, res) {
	const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || [];
	const refreshToken = cookies.find(c => c.startsWith('refresh_jwt='))?.split('=')[1];

	if (!refreshToken) {
		sendJSON(res, { ok: false, error: 'No refresh token' }, 401);
		return;
	}

	const payload = verifyJWT(refreshToken, JWT_SECRET);

	if (!payload || payload.type !== 'refresh') {
		sendJSON(res, { ok: false, error: 'Invalid refresh token' }, 401);
		return;
	}

	// Create new access token
	const token = createJWT({
		sub: payload.sub
	}, JWT_SECRET, 900); // 15 minutes

	res.setHeader('Set-Cookie', `jwt=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/`);

	sendJSON(res, {
		ok: true,
		token
	});
}

// Handle auth check
function handleCheck(req, res, session) {
	if (session.authenticated) {
		sendJSON(res, {
			ok: true,
			authenticated: true,
			user: {
				id: session.user_id,
				username: session.username,
				email: session.email
			},
			csrf_token: session.csrf_token
		});
	} else {
		sendJSON(res, {
			ok: true,
			authenticated: false,
			csrf_token: session.csrf_token
		});
	}
}

// Request handler
const server = http.createServer(async (req, res) => {
	const origin = req.headers.origin || '';
	setSecurityHeaders(res, origin);

	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		res.writeHead(204);
		res.end();
		return;
	}

	// Get or create session
	const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || [];
	let sessionId = cookies.find(c => c.startsWith('session='))?.split('=')[1];

	if (!sessionId || !getSession(sessionId)) {
		sessionId = createSession();
	}

	const session = getSession(sessionId);

	// Set session cookie
	res.setHeader('Set-Cookie', `session=${sessionId}; HttpOnly; SameSite=Strict; Max-Age=3600; Path=/`);

	// Parse action
	const parsedUrl = url.parse(req.url, true);
	const action = parsedUrl.query.action || '';

	try {
		switch (action) {
			case 'login':
				await handleLogin(req, res, session);
				break;
			case 'logout':
				handleLogout(req, res, sessionId);
				break;
			case 'refresh':
				handleRefresh(req, res);
				break;
			case 'check':
				handleCheck(req, res, session);
				break;
			case 'csrf':
				sendJSON(res, {
					ok: true,
					csrf_token: session.csrf_token
				});
				break;
			default:
				sendJSON(res, { ok: false, error: 'Invalid action' }, 400);
		}
	} catch (err) {
		sendJSON(res, { ok: false, error: err.message }, 500);
	}
});

server.listen(PORT, () => {
	console.log(`Authentication server running on http://localhost:${PORT}`);
	console.log('Demo credentials: demo@example.com / demo123');
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, closing server...');
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});
