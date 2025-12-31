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

## Complete CRUD API Example

Let's build a complete REST API for a todo application with full CRUD operations:

### Express Backend with SQLite

```javascript
// server/app.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
app.use(cors());
app.use(express.json());

// Database setup
let db;
(async () => {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
})();

// Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await db.all('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single todo
app.get('/api/todos/:id', async (req, res) => {
  try {
    const todo = await db.get('SELECT * FROM todos WHERE id = ?', req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create todo
app.post('/api/todos', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await db.run(
      'INSERT INTO todos (title) VALUES (?)',
      title
    );

    const todo = await db.get('SELECT * FROM todos WHERE id = ?', result.lastID);
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { title, completed } = req.body;

    await db.run(
      'UPDATE todos SET title = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      title,
      completed ? 1 : 0,
      req.params.id
    );

    const todo = await db.get('SELECT * FROM todos WHERE id = ?', req.params.id);
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM todos WHERE id = ?', req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
```

### Frontend Integration

```javascript
// frontend/services/todo-service.js
class TodoService {
  constructor(baseUrl = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  async getAll() {
    const response = await fetch(`${this.baseUrl}/todos`);
    if (!response.ok) throw new Error('Failed to fetch todos');
    return response.json();
  }

  async create(title) {
    const response = await fetch(`${this.baseUrl}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!response.ok) throw new Error('Failed to create todo');
    return response.json();
  }

  async update(id, updates) {
    const response = await fetch(`${this.baseUrl}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update todo');
    return response.json();
  }

  async delete(id) {
    const response = await fetch(`${this.baseUrl}/todos/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete todo');
  }
}

export const todoService = new TodoService();
```

## Using ORMs

Object-Relational Mappers simplify database operations. Here's Prisma (Node.js) and SQLAlchemy (Python):

### Prisma (Node.js)

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}
```

```javascript
// server/routes/posts.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.get('/api/posts', async (req, res) => {
  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(posts);
});

app.post('/api/posts', authenticate, async (req, res) => {
  const { title, content } = req.body;

  const post = await prisma.post.create({
    data: {
      title,
      content,
      author: {
        connect: { id: req.user.id }
      }
    },
    include: { author: true }
  });

  res.status(201).json(post);
});

app.put('/api/posts/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, content, published } = req.body;

  // Check ownership
  const post = await prisma.post.findUnique({
    where: { id: parseInt(id) }
  });

  if (post.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = await prisma.post.update({
    where: { id: parseInt(id) },
    data: { title, content, published },
    include: { author: true }
  });

  res.json(updated);
});
```

### SQLAlchemy (Python)

```python
# models.py
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    posts = relationship("Post", back_populates="author")
    created_at = Column(DateTime, default=datetime.utcnow)

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    published = Column(Boolean, default=False)
    author_id = Column(Integer, ForeignKey("users.id"))
    author = relationship("User", back_populates="posts")
    created_at = Column(DateTime, default=datetime.utcnow)

# routes.py
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

app = FastAPI()

@app.get("/api/posts", response_model=List[schemas.Post])
def get_posts(db: Session = Depends(get_db)):
    return db.query(models.Post).order_by(models.Post.created_at.desc()).all()

@app.post("/api/posts", response_model=schemas.Post)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_post = models.Post(**post.dict(), author_id=user.id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.put("/api/posts/{post_id}", response_model=schemas.Post)
def update_post(post_id: int, post: schemas.PostUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    if db_post.author_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for key, value in post.dict(exclude_unset=True).items():
        setattr(db_post, key, value)

    db.commit()
    db.refresh(db_post)
    return db_post
```

## File Upload and Download

Handle file uploads from LARC components:

### Express File Upload

```javascript
// server.js
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// Upload endpoint
app.post('/api/upload', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Save file metadata to database
  const file = await db.files.create({
    userId: req.user.id,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  });

  res.json({
    id: file.id,
    filename: file.filename,
    url: `/uploads/${file.filename}`
  });
});

// Download endpoint
app.get('/api/files/:id/download', authenticate, async (req, res) => {
  const file = await db.files.findById(req.params.id);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(file.path, file.originalName);
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));
```

### Frontend Upload Component

```javascript
class FileUpload extends HTMLElement {
  async handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = auth.getToken();
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      pan.publish('file.uploaded', result);

      this.showSuccess(`File uploaded: ${result.filename}`);
    } catch (error) {
      this.showError(error.message);
    }
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="upload-container">
        <input type="file" id="file-input">
        <button onclick="document.getElementById('file-input').click()">
          Choose File
        </button>
        <div class="message"></div>
      </div>
    `;

    this.querySelector('#file-input').addEventListener('change', (e) => {
      this.handleUpload(e);
    });
  }
}

customElements.define('file-upload', FileUpload);
```

## Real-Time Chat Application

Complete example combining HTTP and WebSocket:

### Backend (Node.js)

```javascript
// chat-server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());

// Store active connections
const connections = new Map(); // ws -> user
const rooms = new Map(); // roomId -> Set of ws

// REST API for chat history
app.get('/api/rooms/:roomId/messages', authenticate, async (req, res) => {
  const messages = await db.query(
    'SELECT * FROM messages WHERE room_id = ? ORDER BY created_at ASC',
    [req.params.roomId]
  );
  res.json(messages);
});

app.post('/api/rooms/:roomId/messages', authenticate, async (req, res) => {
  const { content } = req.body;

  const message = await db.query(
    'INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)',
    [req.params.roomId, req.user.id, content]
  );

  res.status(201).json(message);
});

// WebSocket for real-time
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'ws://localhost');
  const token = url.searchParams.get('token');

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    connections.set(ws, user);

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      handleMessage(ws, user, message);
    });

    ws.on('close', () => {
      connections.delete(ws);
      // Remove from all rooms
      rooms.forEach(roomClients => roomClients.delete(ws));
    });

    ws.send(JSON.stringify({ type: 'connected', user }));
  } catch {
    ws.close(4001, 'Unauthorized');
  }
});

function handleMessage(ws, user, message) {
  switch (message.type) {
    case 'join-room':
      if (!rooms.has(message.roomId)) {
        rooms.set(message.roomId, new Set());
      }
      rooms.get(message.roomId).add(ws);

      // Notify room
      broadcastToRoom(message.roomId, {
        type: 'user-joined',
        user: { id: user.id, name: user.name }
      });
      break;

    case 'leave-room':
      rooms.get(message.roomId)?.delete(ws);

      broadcastToRoom(message.roomId, {
        type: 'user-left',
        user: { id: user.id, name: user.name }
      });
      break;

    case 'chat-message':
      // Save to database
      db.query(
        'INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)',
        [message.roomId, user.id, message.content]
      ).then(result => {
        // Broadcast to room
        broadcastToRoom(message.roomId, {
          type: 'chat-message',
          message: {
            id: result.insertId,
            userId: user.id,
            userName: user.name,
            content: message.content,
            createdAt: new Date()
          }
        });
      });
      break;

    case 'typing':
      broadcastToRoom(message.roomId, {
        type: 'user-typing',
        user: { id: user.id, name: user.name }
      }, ws);
      break;
  }
}

function broadcastToRoom(roomId, message, exclude = null) {
  const roomClients = rooms.get(roomId);
  if (!roomClients) return;

  roomClients.forEach(client => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

server.listen(3000, () => console.log('Chat server running on port 3000'));
```

### Frontend Chat Component

```javascript
class ChatRoom extends HTMLElement {
  constructor() {
    super();
    this.roomId = this.getAttribute('room-id');
    this.messages = [];
    this.ws = null;
    this.typingTimer = null;
  }

  async connectedCallback() {
    await this.loadHistory();
    this.connectWebSocket();
    this.render();
  }

  async loadHistory() {
    try {
      this.messages = await api.get(`/rooms/${this.roomId}/messages`);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }

  connectWebSocket() {
    const token = auth.getToken();
    this.ws = new WebSocket(`ws://localhost:3000?token=${token}`);

    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        type: 'join-room',
        roomId: this.roomId
      }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleWebSocketMessage(data);
    };

    this.ws.onclose = () => {
      // Reconnect after 3 seconds
      setTimeout(() => this.connectWebSocket(), 3000);
    };
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'chat-message':
        this.messages.push(data.message);
        this.render();
        this.scrollToBottom();
        break;

      case 'user-joined':
        this.showNotification(`${data.user.name} joined`);
        break;

      case 'user-left':
        this.showNotification(`${data.user.name} left`);
        break;

      case 'user-typing':
        this.showTypingIndicator(data.user.name);
        break;
    }
  }

  sendMessage(content) {
    if (!content.trim()) return;

    this.ws.send(JSON.stringify({
      type: 'chat-message',
      roomId: this.roomId,
      content
    }));

    this.querySelector('#message-input').value = '';
  }

  handleTyping() {
    clearTimeout(this.typingTimer);

    this.ws.send(JSON.stringify({
      type: 'typing',
      roomId: this.roomId
    }));

    this.typingTimer = setTimeout(() => {
      // Stop typing indicator after 2 seconds
    }, 2000);
  }

  render() {
    this.innerHTML = `
      <style>
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 600px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .message {
          margin-bottom: 15px;
        }

        .message-author {
          font-weight: 600;
          color: #667eea;
        }

        .message-content {
          margin-top: 5px;
        }

        .message-time {
          font-size: 12px;
          color: #999;
        }

        .input-area {
          display: flex;
          gap: 10px;
          padding: 15px;
          border-top: 1px solid #ddd;
        }

        input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        button {
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      </style>

      <div class="chat-container">
        <div class="messages">
          ${this.messages.map(msg => `
            <div class="message">
              <div class="message-author">${msg.userName}</div>
              <div class="message-content">${this.escapeHtml(msg.content)}</div>
              <div class="message-time">${new Date(msg.createdAt).toLocaleTimeString()}</div>
            </div>
          `).join('')}
        </div>

        <div class="input-area">
          <input
            type="text"
            id="message-input"
            placeholder="Type a message..."
          >
          <button id="send-btn">Send</button>
        </div>
      </div>
    `;

    const input = this.querySelector('#message-input');
    const sendBtn = this.querySelector('#send-btn');

    input.addEventListener('input', () => this.handleTyping());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage(input.value);
      }
    });

    sendBtn.addEventListener('click', () => {
      this.sendMessage(input.value);
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  scrollToBottom() {
    const messages = this.querySelector('.messages');
    messages.scrollTop = messages.scrollHeight;
  }

  disconnectedCallback() {
    if (this.ws) {
      this.ws.send(JSON.stringify({
        type: 'leave-room',
        roomId: this.roomId
      }));
      this.ws.close();
    }
  }
}

customElements.define('chat-room', ChatRoom);
```

## Troubleshooting

### Problem: CORS Errors in Development

**Symptom**: `Access-Control-Allow-Origin` errors

**Solution**: Configure CORS properly for development:

```javascript
// Express
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));

// Or for all origins in development
if (process.env.NODE_ENV === 'development') {
  app.use(cors({ origin: '*' }));
}
```

### Problem: Database Connection Pool Exhaustion

**Symptom**: "Too many connections" errors

**Solution**: Configure connection pooling:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Always release connections
app.get('/api/users', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users');
    res.json(result.rows);
  } finally {
    client.release(); // Important!
  }
});
```

### Problem: File Uploads Failing

**Symptom**: 413 Payload Too Large or multipart parsing errors

**Solution**: Increase limits and configure multer properly:

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Max 5 files
  }
});
```

### Problem: WebSocket Connection Drops

**Symptom**: Frequent disconnections

**Solution**: Implement heartbeat/ping-pong:

```javascript
// Server
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// Ping clients every 30 seconds
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Client
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
```

## Best Practices

1. **Use environment variables** - Never hardcode secrets or config
2. **Validate input** - Always validate on the server, not just client
3. **Use connection pooling** - Reuse database connections
4. **Implement rate limiting** - Prevent abuse with rate limits
5. **Log errors properly** - Use structured logging (Winston, Bunyan)
6. **Handle graceful shutdown** - Close connections properly on SIGTERM
7. **Use transactions** - For operations that must succeed or fail together
8. **Sanitize user input** - Prevent SQL injection and XSS
9. **Set security headers** - Use helmet.js or similar
10. **Monitor performance** - Use APM tools (New Relic, DataDog)

## Exercises

### Exercise 1: Build a Blog API

Create a REST API with:

- User registration and authentication
- CRUD operations for blog posts
- Comments on posts
- Search functionality
- Tag/category filtering

**Bonus**: Add pagination and sorting options.

### Exercise 2: Real-Time Notifications

Build a notification system with:

- WebSocket connection for real-time delivery
- Fallback to polling if WebSocket unavailable
- Mark as read/unread functionality
- Notification categories (info, warning, error)
- Persistence to database

**Bonus**: Add push notifications for mobile.

### Exercise 3: File Management System

Create a file management API with:

- Upload multiple files
- Organize files in folders
- Share files with other users
- Generate temporary download links
- Thumbnail generation for images

**Bonus**: Implement file versioning.

### Exercise 4: GraphQL API

Convert a REST API to GraphQL:

- Define schema for users, posts, comments
- Implement resolvers
- Add authentication to resolvers
- Implement subscriptions for real-time
- Optimize N+1 queries with DataLoader

**Bonus**: Add GraphQL Playground for testing.

---

## Summary

Server integration with LARC follows standard web patterns—your frontend communicates via HTTP and WebSockets, regardless of backend technology:

- **REST APIs** with Express, Flask, FastAPI, or PHP
- **ORMs** like Prisma, SQLAlchemy for database access
- **File uploads** with multer or similar libraries
- **Real-time features** with WebSockets
- **Authentication** via JWT tokens
- **Database patterns** with repositories and connection pooling

LARC doesn't dictate your backend choices. Use whatever server technology fits your team's expertise and requirements. The PAN bus on the frontend keeps your components decoupled from implementation details.

---

## Further Reading

**For complete server integration reference:**
- *Building with LARC* Chapter 13: Server Integration - Backend patterns and API design
- *Building with LARC* Chapter 7: Data Fetching and APIs - HTTP and WebSocket patterns
- *Building with LARC* Appendix E: Recipes and Patterns - Server integration recipes
