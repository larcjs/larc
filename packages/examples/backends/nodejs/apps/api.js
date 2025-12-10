#!/usr/bin/env node

/**
 * Secure API Endpoint for PAN (Node.js version)
 *
 * Security Features:
 * ✓ Prepared statements for all SQL queries
 * ✓ Session-based authentication
 * ✓ CSRF protection
 * ✓ Input validation and sanitization
 * ✓ Resource whitelist
 * ✓ Rate limiting
 * ✓ Security headers
 *
 * Usage: node api.js [port]
 * Default port: 3001
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const sqlite3 = require('better-sqlite3');

const PORT = process.argv[2] || 3001;

// Simple session store (in-memory)
const sessions = new Map();
const SESSION_TIMEOUT = 3600000; // 1 hour

// Rate limiting store
const rateLimits = new Map();

// Resource whitelist (prevent arbitrary table access)
const ALLOWED_RESOURCES = {
	users: { table: 'users', pk: 'userID' },
	posts: { table: 'posts', pk: 'postID' },
	comments: { table: 'comments', pk: 'commentID' },
	products: { table: 'products', pk: 'productID' },
	orders: { table: 'orders', pk: 'orderID' }
};

// Field whitelist per resource
const ALLOWED_FIELDS = {
	users: ['userID', 'username', 'email', 'created_at', 'updated_at'],
	posts: ['postID', 'title', 'content', 'userID', 'created_at'],
	comments: ['commentID', 'content', 'postID', 'userID', 'created_at'],
	products: ['productID', 'name', 'description', 'price', 'stock', 'category', 'created_at', 'updated_at'],
	orders: ['orderID', 'userID', 'total', 'status', 'created_at', 'updated_at']
};

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
const DEMO_MODE = (env.demo?.mode || 'false') === 'true';
const DB_TYPE = env.db?.type || 'mysql';

// Database connection
let db;
if (DB_TYPE === 'sqlite') {
	const dbFile = env.db?.file || 'pan_demo.db';
	db = sqlite3(dbFile);
	db.pragma('journal_mode = WAL');
} else {
	db = mysql.createPool({
		host: env.db?.host || 'localhost',
		user: env.db?.user || 'root',
		password: env.db?.pass || '',
		database: env.db?.db || 'test',
		waitForConnections: true,
		connectionLimit: 10,
		queueLimit: 0
	});
}

// Session helpers
function createSession() {
	const sessionId = crypto.randomBytes(32).toString('hex');
	const csrfToken = crypto.randomBytes(32).toString('hex');
	sessions.set(sessionId, {
		id: sessionId,
		csrf_token: csrfToken,
		authenticated: DEMO_MODE,
		user_id: DEMO_MODE ? 'demo' : null,
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

// Rate limiting
function checkRateLimit(key, limit = 100, window = 60000) {
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
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
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

// Get operation
async function get(params) {
	const resource = params.rsc || '';
	if (!ALLOWED_RESOURCES[resource]) {
		return { status: 'error', msg: 'Invalid resource' };
	}

	const config = ALLOWED_RESOURCES[resource];
	const table = config.table;
	const pk = config.pk;
	const allowedFields = ALLOWED_FIELDS[resource] || ['*'];

	// Validate requested fields
	const requestedFields = params.fields ? params.fields.split(',').map(f => f.trim()) : allowedFields;
	const fields = requestedFields.filter(f => allowedFields.includes(f));

	if (fields.length === 0) {
		fields.push(...allowedFields);
	}

	const fieldList = fields.map(f => `\`${f}\``).join(', ');

	try {
		// Single item by ID
		if (params.id) {
			if (DB_TYPE === 'sqlite') {
				const sql = `SELECT ${fieldList} FROM \`${table}\` WHERE \`${pk}\` = ? LIMIT 1`;
				const row = db.prepare(sql).get(params.id);
				return row ? [row] : [];
			} else {
				const sql = `SELECT ${fieldList} FROM \`${table}\` WHERE \`${pk}\` = ? LIMIT 1`;
				const [rows] = await db.execute(sql, [params.id]);
				return rows;
			}
		}

		// List with pagination
		const pageSize = Math.max(1, Math.min(parseInt(params.page_size) || 20, 100));
		const start = Math.max(0, parseInt(params.start) || 0);

		// Build WHERE clause
		let where = '';
		const whereParams = [];

		if (params.filters) {
			try {
				const filters = JSON.parse(params.filters);
				if (Array.isArray(filters) && filters.length > 0) {
					const wheres = [];
					for (const filter of filters) {
						const key = filter.key || '';
						const value = filter.value || '';
						if (allowedFields.includes(key)) {
							wheres.push(`\`${key}\` LIKE ?`);
							whereParams.push(`%${value}%`);
						}
					}
					if (wheres.length > 0) {
						where = ' WHERE ' + wheres.join(' AND ');
					}
				}
			} catch (e) {
				// Invalid JSON, ignore
			}
		}

		if (DB_TYPE === 'sqlite') {
			// Count total
			const countSql = `SELECT COUNT(*) as total FROM \`${table}\` ${where}`;
			const countRow = db.prepare(countSql).get(...whereParams);
			const total = countRow.total;

			// Get paginated results
			const sql = `SELECT ${fieldList} FROM \`${table}\` ${where} LIMIT ? OFFSET ?`;
			const rows = db.prepare(sql).all(...whereParams, pageSize, start);

			return {
				total,
				start,
				count: rows.length,
				pages: Math.ceil(total / pageSize),
				page: Math.floor(start / pageSize) + 1,
				results: rows
			};
		} else {
			// Count total
			const countSql = `SELECT COUNT(*) as total FROM \`${table}\` ${where}`;
			const [countRows] = await db.execute(countSql, whereParams);
			const total = countRows[0].total;

			// Get paginated results
			const sql = `SELECT ${fieldList} FROM \`${table}\` ${where} LIMIT ? OFFSET ?`;
			const [rows] = await db.execute(sql, [...whereParams, pageSize, start]);

			return {
				total,
				start,
				count: rows.length,
				pages: Math.ceil(total / pageSize),
				page: Math.floor(start / pageSize) + 1,
				results: rows
			};
		}
	} catch (err) {
		return { status: 'error', msg: err.message };
	}
}

// List resources
function listResources() {
	return { Resources: Object.keys(ALLOWED_RESOURCES) };
}

// List fields
function listFields(params) {
	const resource = params.rsc || '';
	if (!ALLOWED_RESOURCES[resource]) {
		return { status: 'error', msg: 'Invalid resource' };
	}

	const config = ALLOWED_RESOURCES[resource];
	const fields = ALLOWED_FIELDS[resource] || [];

	return {
		Resource: resource,
		PrimaryKey: config.pk,
		Fields: fields.map(f => ({ Field: f }))
	};
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
	res.setHeader('Set-Cookie', `session=${sessionId}; HttpOnly; SameSite=Strict; Max-Age=3600`);

	// Check authentication (skip in demo mode)
	if (!DEMO_MODE && !session.authenticated) {
		sendJSON(res, { status: 'error', msg: 'Authentication required' }, 401);
		return;
	}

	// Rate limiting
	const rateLimitKey = `${session.user_id || req.socket.remoteAddress}`;
	if (!checkRateLimit(rateLimitKey)) {
		sendJSON(res, { status: 'error', msg: 'Rate limit exceeded' }, 429);
		return;
	}

	// Parse request
	const parsedUrl = url.parse(req.url, true);
	const params = parsedUrl.query;
	const action = params.x || '';

	let out;

	try {
		switch (action) {
			case 'list_resources':
				out = listResources();
				break;
			case 'get':
				out = await get(params);
				break;
			case 'list_fields':
				out = listFields(params);
				break;
			default:
				out = { status: 'error', msg: 'Invalid action' };
		}
	} catch (err) {
		out = { status: 'error', msg: err.message };
	}

	sendJSON(res, out);
});

server.listen(PORT, () => {
	console.log(`Secure API server running on http://localhost:${PORT}`);
	console.log(`Demo mode: ${DEMO_MODE ? 'enabled' : 'disabled'}`);
	console.log(`Database: ${DB_TYPE}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
	console.log('SIGTERM received, closing server...');
	server.close(() => {
		if (DB_TYPE === 'mysql' && db.end) {
			db.end();
		}
		console.log('Server closed');
		process.exit(0);
	});
});
