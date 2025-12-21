# Server Integration

LARC is frontend-agnostic about backends. Whether you're using Node.js, Python, PHP, or any other server technology, the patterns remain the same: your components communicate via HTTP and WebSockets, and the PAN bus coordinates the frontend.

## Node.js with Express

Express is the most popular Node.js framework, and it pairs naturally with LARC:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Public routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await db.users.findByEmail(email);
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({ accessToken, user: { id: user.id, email: user.email } });
});

// Protected routes
app.get('/api/users', authenticate, async (req, res) => {
  const users = await db.users.findAll();
  res.json(users);
});

app.post('/api/users', authenticate, async (req, res) => {
  const user = await db.users.create(req.body);
  res.status(201).json(user);
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Python with Flask

Flask provides a lightweight Python backend:

```python
# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
import jwt

app = Flask(__name__, static_folder='public')
CORS(app)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401

        token = auth_header[7:]
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            request.user = data
        except:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated

@app.route('/api/users')
@token_required
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@app.route('/api/users', methods=['POST'])
@token_required
def create_user():
    data = request.get_json()
    user = User(**data)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

if __name__ == '__main__':
    app.run(debug=True)
```

## PHP Integration

PHP remains popular for web backends:

```php
<?php
// api.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function authenticate() {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? '';

    if (!preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        exit;
    }

    try {
        return JWT::decode($matches[1], new Key($_ENV['JWT_SECRET'], 'HS256'));
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/api/users' && $method === 'GET') {
    $user = authenticate();
    $users = $pdo->query('SELECT id, name, email FROM users')->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users);
}
```

## Real-Time with WebSockets

For real-time features, add WebSocket support. Here's Node.js with the `ws` library:

```javascript
// websocket-server.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map();

wss.on('connection', (ws, req) => {
  // Authenticate connection
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    clients.set(ws, user);
  } catch {
    ws.close(4001, 'Unauthorized');
    return;
  }

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    handleMessage(ws, message);
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

function handleMessage(sender, message) {
  switch (message.type) {
    case 'broadcast':
      // Send to all connected clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
      break;

    case 'direct':
      // Send to specific user
      clients.forEach((user, client) => {
        if (user.id === message.targetUserId && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
      break;
  }
}
```

## Database Patterns

Most backends need a database. Here's a clean repository pattern:

```javascript
// user-repository.js
class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll() {
    return this.db.query('SELECT id, name, email FROM users');
  }

  async findById(id) {
    const [user] = await this.db.query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [id]
    );
    return user;
  }

  async create(data) {
    const result = await this.db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [data.name, data.email, data.hashedPassword]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await this.db.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [data.name, data.email, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    await this.db.query('DELETE FROM users WHERE id = ?', [id]);
  }
}
```
