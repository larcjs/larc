#!/usr/bin/env node

/**
 * Legacy API Server for PAN (Node.js version)
 * Simple database API with list_resources, get, and list_fields operations
 *
 * Usage: node api-legacy.js [port]
 * Default port: 3000
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const mysql = require('mysql2/promise');

const PORT = process.argv[2] || 3000;

// Load environment from .env file
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
				const parts = line.split(/\s*=\s/);
				if (parts.length === 2 && section) {
					out[section][parts[0]] = parts[1].trim();
				}
			}
		}
		return out;
	} catch (err) {
		console.error('Error loading .env:', err.message);
		return {};
	}
}

const env = loadEnvironment('.env');

// Database connection pool
let pool;
try {
	pool = mysql.createPool({
		host: env.db?.host || 'localhost',
		user: env.db?.user || 'root',
		password: env.db?.pass || '',
		database: env.db?.db || 'test',
		waitForConnections: true,
		connectionLimit: 10,
		queueLimit: 0
	});
} catch (err) {
	console.error('Database connection error:', err.message);
	process.exit(1);
}

// Send JSON response
function sendJSON(res, obj, statusCode = 200) {
	res.writeHead(statusCode, {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type'
	});
	res.end(JSON.stringify(obj));
}

// Get operation - retrieve data from a table
async function get(params) {
	const pageSize = Math.min(parseInt(params.page_size) || 20, 20);

	if (!params.rsc) {
		return { status: 'error', msg: 'Missing resource name' };
	}

	const out = {};
	const fields = params.fields || '*';

	try {
		if (params.id) {
			// Single record by ID
			const sql = `SELECT ${mysql.escapeId(fields)} FROM ?? WHERE ?? = ?`;
			const [rows] = await pool.execute(sql, [params.rsc, `${params.rsc}ID`, params.id]);
			return rows;
		} else {
			// List with pagination
			const start = parseInt(params.start) || 0;
			let where = '';
			let whereParams = [];

			if (params.filters) {
				try {
					const filters = JSON.parse(params.filters);
					if (Array.isArray(filters) && filters.length > 0) {
						const wheres = [];
						for (const filter of filters) {
							wheres.push(`${mysql.escapeId(filter.key)} LIKE ?`);
							whereParams.push(`%${filter.value}%`);
						}
						where = ' WHERE ' + wheres.join(' AND ');
					}
				} catch (e) {
					// Invalid JSON, ignore filters
				}
			}

			// Count total
			const countSql = `SELECT COUNT(*) as total FROM ${mysql.escapeId(params.rsc)} ${where}`;
			const [countRows] = await pool.execute(countSql, whereParams);
			out.total = countRows[0].total;
			out.start = start;

			// Get paginated results
			const sql = `SELECT ${fields} FROM ${mysql.escapeId(params.rsc)} ${where} LIMIT ? OFFSET ?`;
			const [rows] = await pool.execute(sql, [...whereParams, pageSize, start]);
			out.results = rows;
			out.count = rows.length;
			out.pages = Math.ceil(out.total / pageSize);
			out.page = Math.floor(start / pageSize) + 1;

			return out;
		}
	} catch (err) {
		return { status: 'error', msg: err.message };
	}
}

// List resources - show available tables
async function listResources(params) {
	try {
		let sql = 'SHOW TABLES';
		const queryParams = [];

		if (params.filter) {
			sql += ' LIKE ?';
			queryParams.push(`%${params.filter}%`);
		}

		const [rows] = await pool.execute(sql, queryParams);
		const tables = rows.map(row => Object.values(row)[0]);
		return { Resources: tables };
	} catch (err) {
		return { status: 'error', msg: err.message };
	}
}

// List fields - describe table structure
async function listFields(params) {
	if (!params.rsc || params.rsc === '') {
		return { status: 'error', msg: 'Missing rsc' };
	}

	try {
		const table = params.rsc;
		const fields = [];
		let pk = null;

		// Describe columns
		const sql = `SHOW COLUMNS FROM ${mysql.escapeId(table)}`;
		const [rows] = await pool.execute(sql);

		for (const col of rows) {
			fields.push({
				Field: col.Field,
				Type: col.Type,
				Null: col.Null,
				Key: col.Key,
				Default: col.Default,
				Extra: col.Extra
			});
			if (col.Key === 'PRI' && pk === null) {
				pk = col.Field;
			}
		}

		// Fallback to conventional <Table>ID if no explicit PK found
		if (pk === null) {
			pk = table + 'ID';
		}

		return { Resource: table, PrimaryKey: pk, Fields: fields };
	} catch (err) {
		return { status: 'error', msg: err.message };
	}
}

// Request handler
const server = http.createServer(async (req, res) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		res.writeHead(204, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		});
		res.end();
		return;
	}

	const parsedUrl = url.parse(req.url, true);
	const params = parsedUrl.query;

	let out = '';

	if (params.x) {
		try {
			switch (params.x) {
				case 'list_resources':
					out = await listResources(params);
					break;
				case 'get':
					out = await get(params);
					break;
				case 'list_fields':
					out = await listFields(params);
					break;
				default:
					out = await get(params);
			}
		} catch (err) {
			out = { status: 'error', msg: err.message };
		}
	} else {
		out = { status: 'error', msg: 'Invalid request' };
	}

	sendJSON(res, out);
});

server.listen(PORT, () => {
	console.log(`Legacy API server running on http://localhost:${PORT}`);
	console.log('Usage: ?x=list_resources | ?x=get&rsc=tablename | ?x=list_fields&rsc=tablename');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
	console.log('SIGTERM received, closing server...');
	server.close(() => {
		pool.end();
		console.log('Server closed');
		process.exit(0);
	});
});
