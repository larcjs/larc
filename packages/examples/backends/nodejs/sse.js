#!/usr/bin/env node

/**
 * SSE Hub for PAN (Node.js version)
 *
 * Simple SSE hub for PAN: GET streams events; POST appends and broadcasts.
 * - GET /sse?topics=topic1,topic2&lastEventId=123
 * - POST /sse  { "topic": "demo.ping", "data": { ... }, "retain": false }
 *
 * Config: file-backed queue under ./.rt
 *
 * Usage: node sse.js [port]
 * Default port: 3003
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || 3003;
const RT_DIR = path.join(__dirname, '.rt');
const SEQ_FILE = path.join(RT_DIR, 'seq.txt');
const LOG_FILE = path.join(RT_DIR, 'pan-events.ndjson');

// Ensure runtime dir exists
if (!fs.existsSync(RT_DIR)) {
	fs.mkdirSync(RT_DIR, { recursive: true });
}
if (!fs.existsSync(SEQ_FILE)) {
	fs.writeFileSync(SEQ_FILE, '0\n');
}
if (!fs.existsSync(LOG_FILE)) {
	fs.writeFileSync(LOG_FILE, '');
}

// Active SSE connections
const connections = new Set();

// Security headers
function setSecurityHeaders(res, origin) {
	const allowedOrigins = [
		'https://cdr2.com',
		'https://www.cdr2.com',
		'https://localhost:8443',
		'http://localhost:8080'
	];

	const headers = {
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Last-Event-ID',
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

// Get next event ID
function getNextId() {
	try {
		const seq = parseInt(fs.readFileSync(SEQ_FILE, 'utf8').trim()) || 0;
		const nextId = seq + 1;
		fs.writeFileSync(SEQ_FILE, nextId.toString() + '\n');
		return nextId;
	} catch (err) {
		// Fallback: read last ID from log
		try {
			const content = fs.readFileSync(LOG_FILE, 'utf8');
			const lines = content.trim().split('\n').filter(l => l);
			if (lines.length > 0) {
				const lastLine = lines[lines.length - 1];
				const rec = JSON.parse(lastLine);
				return (rec.id || 0) + 1;
			}
		} catch (e) {
			// Ignore
		}
		return 1;
	}
}

// Append event to log
function appendEvent(topic, data, retain = false) {
	try {
		const id = getNextId();
		const rec = {
			id,
			ts: Math.floor(Date.now() / 1000),
			topic,
			data
		};

		if (retain) {
			rec.retain = true;
		}

		const line = JSON.stringify(rec) + '\n';
		fs.appendFileSync(LOG_FILE, line);

		// Broadcast to all SSE connections
		broadcastEvent(rec);

		return { ok: true, id };
	} catch (err) {
		return { ok: false, error: err.message };
	}
}

// Broadcast event to all connected clients
function broadcastEvent(rec) {
	const id = rec.id;
	const topic = rec.topic;
	const data = rec.data;
	const retain = rec.retain || false;

	const payload = { topic, data };
	if (retain) payload.retain = true;

	const message = `id: ${id}\nevent: ${topic}\ndata: ${JSON.stringify(payload)}\n\n`;

	for (const conn of connections) {
		try {
			if (topicMatches(topic, conn.patterns)) {
				conn.res.write(message);
			}
		} catch (e) {
			connections.delete(conn);
		}
	}
}

// Check if topic matches patterns
function topicMatches(topic, patterns) {
	if (!patterns || patterns.length === 0) return true;

	for (const p of patterns) {
		if (!p || p === '' || p === '*') return true;

		// Convert PAN wildcard ("*" for single token) to regex
		const regex = new RegExp('^' + p.replace(/\*/g, '[^.]+') + '$');
		if (regex.test(topic)) return true;
	}

	return false;
}

// Read events from log file
function readEvents(lastId = null, patterns = []) {
	try {
		const content = fs.readFileSync(LOG_FILE, 'utf8');
		const lines = content.trim().split('\n').filter(l => l);
		const events = [];

		for (const line of lines) {
			try {
				const rec = JSON.parse(line);
				if (lastId !== null && rec.id <= lastId) continue;
				if (!topicMatches(rec.topic, patterns)) continue;
				events.push(rec);
			} catch (e) {
				// Skip invalid lines
			}
		}

		return events;
	} catch (err) {
		return [];
	}
}

// Handle POST - append event
async function handlePost(req, res) {
	const body = await parseBody(req);

	if (!body || !body.topic) {
		sendJSON(res, { ok: false, error: 'invalid-payload: require {topic, data?}' }, 400);
		return;
	}

	const topic = body.topic;
	const data = body.data || null;
	const retain = body.retain || false;

	const result = appendEvent(topic, data, retain);
	sendJSON(res, result, result.ok ? 200 : 500);
}

// Handle GET - SSE stream
function handleGet(req, res) {
	const parsedUrl = url.parse(req.url, true);
	const query = parsedUrl.query;

	const topicsRaw = query.topics || '';
	const patterns = topicsRaw.split(/[,\s]+/).map(p => p.trim()).filter(p => p);

	let lastId = query.lastEventId ? parseInt(query.lastEventId) : null;

	// Also accept Last-Event-ID header
	const hdrLast = req.headers['last-event-id'];
	if (lastId === null && hdrLast) {
		lastId = parseInt(hdrLast);
	}

	// SSE headers
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'X-Accel-Buffering': 'no'
	});

	// Send past events if lastEventId provided
	const pastEvents = readEvents(lastId, patterns);
	for (const rec of pastEvents) {
		const payload = { topic: rec.topic, data: rec.data };
		if (rec.retain) payload.retain = true;
		res.write(`id: ${rec.id}\nevent: ${rec.topic}\ndata: ${JSON.stringify(payload)}\n\n`);
	}

	// Register this connection for future broadcasts
	const conn = { res, patterns };
	connections.add(conn);

	// Keepalive interval
	const keepaliveInterval = setInterval(() => {
		try {
			res.write(': keepalive\n\n');
		} catch (e) {
			clearInterval(keepaliveInterval);
			connections.delete(conn);
		}
	}, 15000);

	// Clean up on disconnect
	req.on('close', () => {
		clearInterval(keepaliveInterval);
		connections.delete(conn);
	});

	// Connection timeout (5 minutes)
	setTimeout(() => {
		try {
			clearInterval(keepaliveInterval);
			connections.delete(conn);
			res.end();
		} catch (e) {
			// Already closed
		}
	}, 300000);
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

	try {
		if (req.method === 'POST') {
			await handlePost(req, res);
		} else if (req.method === 'GET') {
			handleGet(req, res);
		} else {
			sendJSON(res, { ok: false, error: 'method-not-allowed' }, 405);
		}
	} catch (err) {
		sendJSON(res, { ok: false, error: err.message }, 500);
	}
});

server.listen(PORT, () => {
	console.log(`SSE server running on http://localhost:${PORT}`);
	console.log(`Event log: ${LOG_FILE}`);
	console.log('GET /sse?topics=topic1,topic2&lastEventId=123');
	console.log('POST /sse with { "topic": "demo.ping", "data": {...}, "retain": false }');
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, closing server...');

	// Close all SSE connections
	for (const conn of connections) {
		try {
			conn.res.end();
		} catch (e) {
			// Ignore
		}
	}
	connections.clear();

	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});
