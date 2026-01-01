# Integration Components Reference

API documentation for LARC's integration components. For tutorials, see *Learning LARC* Chapter 11.

## pan-data-connector

**Purpose**: Declarative REST API bridge with CRUD pattern  
**Import**: `<script type="module" src="/ui/pan-data-connector.mjs"></script>`

### Quick Example

```html
<pan-data-connector
  resource="users"
  base-url="https://api.example.com"
  key="id">
</pan-data-connector>

<script type="module">
import { PanClient } from './pan-client.mjs';

const pc = new PanClient();

// Fetch list
pc.publish('users.list.get', { page: 1, limit: 20 });

// Listen for results
pc.subscribe('users.list.state', (msg) => {
  console.log('Users:', msg.data.items);
});

// Get single item
pc.publish('users.item.get', { id: 123 });

// Save item
pc.publish('users.item.save', {
  id: 123,
  name: 'Alice',
  email: 'alice@example.com'
});
</script>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `resource` | String | "items" | Resource name (topic prefix) |
| `base-url` | String | "" | API base URL |
| `key` | String | "id" | Unique identifier field |
| `list-path` | String | "/\${resource}" | List endpoint template |
| `item-path` | String | "/\${resource}/:id" | Item endpoint template |
| `update-method` | String | "PUT" | HTTP method for updates (PUT/PATCH) |
| `credentials` | String | "" | Fetch credentials mode |

**Headers configuration** (via `<script type="application/json">`):
```html
<pan-data-connector resource="users" base-url="/api">
  <script type="application/json">
    {
      "headers": {
        "Authorization": "Bearer TOKEN",
        "X-API-Version": "2023-01"
      }
    }
  </script>
</pan-data-connector>
```

### PAN Topics

#### Subscribed (Requests)

| Topic | Data | HTTP Request | Description |
|-------|------|--------------|-------------|
| `\${resource}.list.get` | `{ ...query }` | GET /\${resource} | Fetch list |
| `\${resource}.item.get` | `{ id }` | GET /\${resource}/:id | Fetch single item |
| `\${resource}.item.save` | `{ id?, ...data }` | POST or PUT | Create/update item |
| `\${resource}.item.delete` | `{ id }` | DELETE /\${resource}/:id | Delete item |

#### Published (Responses)

| Topic | Data | Description |
|-------|------|-------------|
| `\${resource}.list.state` | `{ items: [...], meta? }` | List results (retained) |
| `\${resource}.item.state.\${id}` | `{ ...item }` | Single item (retained) |
| `\${resource}.error` | `{ operation, error, status }` | Error occurred |

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-bus.mjs';
    import './pan-data-connector.mjs';
    import { PanClient } from './pan-client.mjs';

    customElements.whenDefined('pan-bus').then(() => {
      const pc = new PanClient();

      // Render user list
      pc.subscribe('users.list.state', (msg) => {
        const list = document.getElementById('user-list');
        list.innerHTML = msg.data.items.map(user => `
          <li>
            ${user.name} (${user.email})
            <button onclick="editUser(${user.id})">Edit</button>
            <button onclick="deleteUser(${user.id})">Delete</button>
          </li>
        `).join('');
      });

      // Handle errors
      pc.subscribe('users.error', (msg) => {
        console.error('API Error:', msg.data.error);
        alert(`Error: ${msg.data.error}`);
      });

      // Load users on startup
      pc.publish('users.list.get', {});

      // CRUD operations
      window.editUser = (id) => {
        pc.publish('users.item.get', { id });
        pc.subscribe('users.item.state.' + id, (msg) => {
          document.getElementById('name').value = msg.data.name;
          document.getElementById('email').value = msg.data.email;
          document.getElementById('user-id').value = msg.data.id;
        });
      };

      window.saveUser = () => {
        const id = document.getElementById('user-id').value;
        pc.publish('users.item.save', {
          id: id || undefined,
          name: document.getElementById('name').value,
          email: document.getElementById('email').value
        });
      };

      window.deleteUser = (id) => {
        if (confirm('Delete user?')) {
          pc.publish('users.item.delete', { id });
          setTimeout(() => pc.publish('users.list.get', {}), 100);
        }
      };
    });
  </script>
</head>
<body>
  <pan-bus></pan-bus>
  <pan-data-connector resource="users" base-url="/api" key="id"></pan-data-connector>

  <div>
    <h2>Users</h2>
    <ul id="user-list"></ul>

    <h3>Edit User</h3>
    <input type="hidden" id="user-id">
    <input id="name" placeholder="Name">
    <input id="email" placeholder="Email">
    <button onclick="saveUser()">Save</button>
  </div>
</body>
</html>
```

### Errors

pan-data-connector publishes errors to `${resource}.error` topic:

| Error Condition | Cause | Resolution |
|-----------------|-------|------------|
| `NETWORK_ERROR` | Fetch failed (offline, DNS, timeout) | Check network connection and API availability |
| `HTTP_4XX` | Client error (400-499) | Verify request data and authentication |
| `HTTP_5XX` | Server error (500-599) | Check API server logs, retry with backoff |
| `PARSE_ERROR` | Response not valid JSON | Check API response format |
| `CORS_ERROR` | Cross-origin request blocked | Configure CORS headers on server |
| `INVALID_CONFIG` | Missing required attributes | Set `resource` and `base-url` attributes |

**Error handling example**:
```javascript
import { PanClient } from './pan-client.mjs';

const pc = new PanClient();

// Subscribe to errors
pc.subscribe('users.error', (msg) => {
  const { operation, error, status, response } = msg.data;
  console.error(`API Error [${operation}]:`, error);

  switch (true) {
    case status === 401:
      // Unauthorized - redirect to login
      window.location.href = '/login';
      break;

    case status === 404:
      // Not found
      showNotification('Resource not found');
      break;

    case status >= 500:
      // Server error - retry with exponential backoff
      retryWithBackoff(() => {
        pc.publish('users.list.get', {});
      });
      break;

    case error.includes('CORS'):
      // CORS error
      console.error('CORS configuration required on server');
      showCORSHelp();
      break;

    case error.includes('NETWORK'):
      // Network error
      showOfflineMode();
      break;

    default:
      showNotification(`Error: ${error}`);
  }
});

// Retry with exponential backoff
let retryCount = 0;
function retryWithBackoff(fn, maxRetries = 3) {
  if (retryCount >= maxRetries) {
    console.error('Max retries exceeded');
    return;
  }
  const delay = Math.pow(2, retryCount) * 1000;
  setTimeout(() => {
    retryCount++;
    fn();
  }, delay);
}

// Optimistic updates with rollback on error
let previousState = null;
pc.subscribe('users.list.state', (msg) => {
  previousState = msg.data;
});

function saveUserOptimistically(user) {
  // Update UI immediately
  updateUI(user);
  
  // Save to API
  pc.publish('users.item.save', user);
  
  // Rollback on error
  const unsubscribe = pc.subscribe('users.error', (msg) => {
    if (msg.data.operation === 'save') {
      updateUI(previousState);
      unsubscribe();
    }
  });
}
```

**HTTP Status Codes**:
All HTTP status codes are passed through in the error message:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity
- 500: Internal Server Error
- 502: Bad Gateway
- 503: Service Unavailable

### Common Issues

**401/403 errors**: Configure authentication headers via embedded JSON script.

**CORS errors**: Ensure API server sets appropriate CORS headers. Use `credentials="include"` for cookies.

**List doesn't update after save**: Connector doesn't auto-refresh lists. Manually request: `pc.publish('${resource}.list.get', {})`.

**Non-standard API**: Override `list-path` and `item-path` attributes for custom endpoints.

---

## pan-graphql-connector

**Purpose**: GraphQL query and mutation bridge to PAN bus  
**Import**: `<script type="module" src="/ui/pan-graphql-connector.mjs"></script>`

### Quick Example

```html
<pan-graphql-connector
  endpoint="https://api.example.com/graphql"
  resource="users">
  <script type="application/graphql" data-operation="list">
    query GetUsers($limit: Int) {
      users(limit: $limit) {
        id
        name
        email
      }
    }
  </script>

  <script type="application/graphql" data-operation="get">
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
        createdAt
      }
    }
  </script>
</pan-graphql-connector>

<script type="module">
import { PanClient } from './pan-client.mjs';

const pc = new PanClient();

// Execute query
pc.publish('users.list.get', { limit: 10 });

pc.subscribe('users.list.state', (msg) => {
  console.log('Users:', msg.data);
});
</script>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `endpoint` | String | "/graphql" | GraphQL endpoint URL |
| `resource` | String | "items" | Resource name (topic prefix) |
| `key` | String | "id" | Unique identifier field |

**GraphQL operations** (via `<script type="application/graphql">`):

- `data-operation="list"`: List query
- `data-operation="get"`: Single item query
- `data-operation="create"`: Create mutation
- `data-operation="update"`: Update mutation
- `data-operation="delete"`: Delete mutation

**Headers configuration** (via `<script type="application/json">`):
```html
<pan-graphql-connector endpoint="/graphql" resource="users">
  <script type="application/json">
    {
      "headers": {
        "Authorization": "Bearer TOKEN"
      }
    }
  </script>
  <!-- GraphQL scripts... -->
</pan-graphql-connector>
```

### PAN Topics

Same as `pan-data-connector`:

- Subscribe: `${resource}.list.get`, `${resource}.item.get`, `${resource}.item.save`, `${resource}.item.delete`
- Publish: `${resource}.list.state`, `${resource}.item.state.${id}`, `${resource}.error`

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-bus.mjs';
    import './pan-graphql-connector.mjs';
    import { PanClient } from './pan-client.mjs';

    customElements.whenDefined('pan-bus').then(() => {
      const pc = new PanClient();

      // Fetch users
      pc.publish('users.list.get', { limit: 20 });

      // Display results
      pc.subscribe('users.list.state', (msg) => {
        document.getElementById('output').textContent = 
          JSON.stringify(msg.data, null, 2);
      });

      // Handle errors
      pc.subscribe('users.error', (msg) => {
        console.error('GraphQL Error:', msg.data.error);
      });
    });
  </script>
</head>
<body>
  <pan-bus></pan-bus>
  
  <pan-graphql-connector endpoint="https://api.example.com/graphql" resource="users">
    <script type="application/json">
      { "headers": { "Authorization": "Bearer TOKEN" } }
    </script>

    <script type="application/graphql" data-operation="list">
      query GetUsers($limit: Int) {
        users(limit: $limit) {
          id
          name
          email
        }
      }
    </script>

    <script type="application/graphql" data-operation="get">
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
          createdAt
        }
      }
    </script>

    <script type="application/graphql" data-operation="create">
      mutation CreateUser($input: UserInput!) {
        createUser(input: $input) {
          id
          name
          email
        }
      }
    </script>
  </pan-graphql-connector>

  <button onclick="pc.publish('users.list.get', { limit: 10 })">Load Users</button>
  <pre id="output"></pre>
</body>
</html>
```

### Errors

pan-graphql-connector publishes errors to `${resource}.error` topic:

| Error Condition | Cause | Resolution |
|-----------------|-------|------------|
| `GRAPHQL_ERROR` | GraphQL errors in response | Check query syntax and schema |
| `NETWORK_ERROR` | Fetch failed | Check network and endpoint URL |
| `PARSE_ERROR` | Response not valid JSON | Check GraphQL endpoint response format |
| `MISSING_OPERATION` | No query/mutation defined for operation | Add `<script type="application/graphql" data-operation="...">` |
| `VALIDATION_ERROR` | GraphQL validation failed | Fix query variables or schema mismatch |
| `AUTH_ERROR` | Authentication failed | Check Authorization header |

**Error handling example**:
```javascript
import { PanClient } from './pan-client.mjs';

const pc = new PanClient();

// Subscribe to GraphQL errors
pc.subscribe('users.error', (msg) => {
  const { operation, error, graphqlErrors, status } = msg.data;
  console.error(`GraphQL Error [${operation}]:`, error);

  // Handle GraphQL-specific errors
  if (graphqlErrors && graphqlErrors.length > 0) {
    graphqlErrors.forEach(err => {
      console.error(`  - ${err.message}`);
      
      // Handle specific error types
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        redirectToLogin();
      } else if (err.extensions?.code === 'FORBIDDEN') {
        showNotification('Access denied');
      } else if (err.path) {
        showFieldError(err.path.join('.'), err.message);
      }
    });
  }

  // Handle network errors
  if (error.includes('NETWORK')) {
    showOfflineMode();
  }

  // Handle missing operations
  if (error.includes('MISSING_OPERATION')) {
    console.error(`Add <script type="application/graphql" data-operation="${operation}"> to component`);
  }
});

// Retry with different variables on error
function retryQueryWithFallback() {
  const unsubscribe = pc.subscribe('users.error', (msg) => {
    if (msg.data.operation === 'list') {
      // Try with reduced limit
      pc.publish('users.list.get', { limit: 10 });
      unsubscribe();
    }
  });
  
  pc.publish('users.list.get', { limit: 100 });
}

// Handle partial data from GraphQL
pc.subscribe('users.list.state', (msg) => {
  const { items, errors } = msg.data;
  
  if (errors) {
    // GraphQL can return partial data with errors
    console.warn('Partial data received with errors:', errors);
    showWarning('Some data may be incomplete');
  }
  
  displayUsers(items || []);
});
```

**GraphQL Error Extensions**:
GraphQL servers often include error codes in `extensions`:

- `UNAUTHENTICATED`: Not logged in
- `FORBIDDEN`: Insufficient permissions
- `BAD_USER_INPUT`: Invalid variables
- `GRAPHQL_VALIDATION_FAILED`: Query validation error
- `PERSISTED_QUERY_NOT_FOUND`: Persisted query ID not found

### Common Issues

**Query not found**: Ensure `data-operation` attribute matches operation type (list/get/create/update/delete).

**Variables not passed**: Variable names must match GraphQL schema. Check operation definitions.

**Response path mapping**: Use `data-path` attribute to specify nested result path: `data-path="data.users"`.

---

## pan-websocket

**Purpose**: Bidirectional WebSocket communication via PAN bus  
**Import**: `<script type="module" src="/ui/pan-websocket.mjs"></script>`

### Quick Example

```html
<pan-websocket
  url="wss://api.example.com/ws"
  auto-connect="true">
</pan-websocket>

<script type="module">
import { PanClient } from './pan-client.mjs';

const pc = new PanClient();

// Listen for connection
pc.subscribe('ws.connected', (msg) => {
  console.log('WebSocket connected');
});

// Send message
pc.publish('ws.send', { 
  type: 'subscribe',
  channel: 'notifications'
});

// Receive messages
pc.subscribe('ws.message', (msg) => {
  console.log('Received:', msg.data);
});
</script>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | String | "" | WebSocket URL (ws:// or wss://) |
| `auto-connect` | Boolean | false | Connect on component mount |
| `auto-reconnect` | Boolean | true | Reconnect on disconnect |
| `reconnect-delay` | Number | 1000 | Reconnect delay (ms) |
| `max-reconnect-attempts` | Number | Infinity | Max reconnection attempts |

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `connect()` | - | Promise\<void\> | Open WebSocket connection |
| `disconnect()` | - | void | Close connection |
| `send(data)` | data: Any | void | Send message (auto-serializes JSON) |

### PAN Topics

#### Published

| Topic | Data | Description |
|-------|------|-------------|
| `ws.connected` | `{ url }` | Connection opened |
| `ws.disconnected` | `{ code, reason }` | Connection closed |
| `ws.message` | `{ ...data }` | Message received |
| `ws.error` | `{ error }` | Error occurred |

#### Subscribed

| Topic | Data | Description |
|-------|------|-------------|
| `ws.connect` | `{ url? }` | Open connection |
| `ws.disconnect` | `{}` | Close connection |
| `ws.send` | `{ ...data }` | Send message |

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-bus.mjs';
    import './pan-websocket.mjs';
    import { PanClient } from './pan-client.mjs';

    customElements.whenDefined('pan-bus').then(() => {
      const pc = new PanClient();

      // Connection status
      pc.subscribe('ws.connected', (msg) => {
        document.getElementById('status').textContent = 'Connected';
        document.getElementById('status').style.color = 'green';
      });

      pc.subscribe('ws.disconnected', (msg) => {
        document.getElementById('status').textContent = 'Disconnected';
        document.getElementById('status').style.color = 'red';
      });

      // Receive messages
      pc.subscribe('ws.message', (msg) => {
        const log = document.getElementById('log');
        const entry = document.createElement('div');
        entry.textContent = JSON.stringify(msg.data);
        log.prepend(entry);
      });

      // Send message
      window.sendMessage = () => {
        const input = document.getElementById('message');
        pc.publish('ws.send', { 
          type: 'chat',
          message: input.value,
          timestamp: Date.now()
        });
        input.value = '';
      };

      // Connect/disconnect
      window.connect = () => pc.publish('ws.connect', {});
      window.disconnect = () => pc.publish('ws.disconnect', {});
    });
  </script>
</head>
<body>
  <pan-bus></pan-bus>
  <pan-websocket url="wss://api.example.com/ws" auto-connect="false"></pan-websocket>

  <div>
    <h2>WebSocket Demo</h2>
    Status: <span id="status">Disconnected</span>
    <button onclick="connect()">Connect</button>
    <button onclick="disconnect()">Disconnect</button>

    <div>
      <input id="message" placeholder="Enter message">
      <button onclick="sendMessage()">Send</button>
    </div>

    <h3>Log</h3>
    <div id="log"></div>
  </div>
</body>
</html>
```

### Errors

pan-websocket publishes errors to `ws.error` topic:

| Error Condition | Cause | Resolution |
|-----------------|-------|------------|
| `CONNECTION_FAILED` | Cannot connect to WebSocket server | Check URL and server availability |
| `CONNECTION_CLOSED` | Connection closed unexpectedly | Check server logs, will auto-reconnect if enabled |
| `SEND_FAILED` | Message send failed | Check connection status before sending |
| `INVALID_URL` | WebSocket URL is invalid | Use valid ws:// or wss:// URL |
| `MAX_RECONNECT_EXCEEDED` | Max reconnection attempts reached | Check server, increase max attempts, or fix issue |
| `MESSAGE_PARSE_ERROR` | Cannot parse received message | Check message format from server |

**Error handling example**:
```javascript
import { PanClient } from './pan-client.mjs';

const pc = new PanClient();

// Subscribe to errors
pc.subscribe('ws.error', (msg) => {
  const { error, code, url } = msg.data;
  console.error('WebSocket Error:', error);

  switch (code) {
    case 1006: // Abnormal closure
      console.warn('Connection lost abnormally');
      showNotification('Connection lost, reconnecting...');
      break;

    case 1008: // Policy violation
      console.error('Connection rejected by server');
      showNotification('Access denied');
      break;

    case 1011: // Server error
      console.error('Server error occurred');
      retryAfterDelay(5000);
      break;

    default:
      if (error.includes('MAX_RECONNECT_EXCEEDED')) {
        showNotification('Cannot connect to server');
        showOfflineMode();
      }
  }
});

// Monitor connection lifecycle
let connectionAttempts = 0;

pc.subscribe('ws.connected', (msg) => {
  connectionAttempts = 0;
  console.log('WebSocket connected');
  showOnlineStatus();
});

pc.subscribe('ws.disconnected', (msg) => {
  const { code, reason } = msg.data;
  console.log(`Disconnected: ${code} - ${reason}`);
  
  connectionAttempts++;
  if (connectionAttempts > 3) {
    showPersistentConnectionIssueWarning();
  }
});

// Heartbeat to detect connection issues
let heartbeatInterval;
let lastHeartbeat = Date.now();

pc.subscribe('ws.connected', () => {
  heartbeatInterval = setInterval(() => {
    pc.publish('ws.send', { type: 'ping', timestamp: Date.now() });
    
    // Check if we've received pong
    if (Date.now() - lastHeartbeat > 30000) {
      console.warn('Heartbeat timeout, reconnecting...');
      pc.publish('ws.disconnect', {});
      setTimeout(() => pc.publish('ws.connect', {}), 1000);
    }
  }, 10000);
});

pc.subscribe('ws.message', (msg) => {
  if (msg.data.type === 'pong') {
    lastHeartbeat = Date.now();
  }
});

pc.subscribe('ws.disconnected', () => {
  clearInterval(heartbeatInterval);
});

// Message queuing when offline
const messageQueue = [];

function sendMessage(data) {
  // Check if connected
  if (document.querySelector('pan-websocket').readyState === WebSocket.OPEN) {
    pc.publish('ws.send', data);
  } else {
    // Queue message
    messageQueue.push(data);
    console.log('Message queued (offline)');
  }
}

// Send queued messages on reconnect
pc.subscribe('ws.connected', () => {
  while (messageQueue.length > 0) {
    const data = messageQueue.shift();
    pc.publish('ws.send', data);
  }
});
```

**WebSocket Close Codes**:
Standard close codes passed in `ws.disconnected`:

- 1000: Normal closure
- 1001: Going away (page unload)
- 1002: Protocol error
- 1003: Unsupported data
- 1006: Abnormal closure (no close frame)
- 1007: Invalid data
- 1008: Policy violation
- 1009: Message too big
- 1011: Server error

### Common Issues

**Connection fails**: Check URL scheme (ws:// for HTTP, wss:// for HTTPS). Ensure server is running.

**Auto-reconnect loops**: Increase `reconnect-delay` or set `max-reconnect-attempts` to prevent rapid retries.

**Messages not received**: Ensure message format matches expected structure. Check `ws.message` subscription.

**CORS issues**: WebSocket doesn't use CORS. Check server's Origin header validation.

---

## pan-sse

**Purpose**: Server-Sent Events streaming via PAN bus  
**Import**: `<script type="module" src="/ui/pan-sse.mjs"></script>`

### Quick Example

```html
<pan-sse
  url="https://api.example.com/events"
  auto-connect="true">
</pan-sse>

<script type="module">
import { PanClient } from './pan-client.mjs';

const pc = new PanClient();

// Listen for connection
pc.subscribe('sse.connected', (msg) => {
  console.log('SSE connected');
});

// Receive events
pc.subscribe('sse.message', (msg) => {
  console.log('Event:', msg.data);
});

// Receive custom event types
pc.subscribe('sse.event.notification', (msg) => {
  console.log('Notification:', msg.data);
});
</script>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | String | "" | SSE endpoint URL |
| `auto-connect` | Boolean | false | Connect on mount |
| `with-credentials` | Boolean | false | Include credentials in request |

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `connect()` | - | void | Open SSE connection |
| `disconnect()` | - | void | Close connection |

### PAN Topics

#### Published

| Topic | Data | Description |
|-------|------|-------------|
| `sse.connected` | `{ url }` | Connection opened |
| `sse.disconnected` | `{}` | Connection closed |
| `sse.message` | `{ data, id?, type? }` | Default message event |
| `sse.event.\${type}` | `{ data, id? }` | Custom event type |
| `sse.error` | `{ error }` | Error occurred |

#### Subscribed

| Topic | Data | Description |
|-------|------|-------------|
| `sse.connect` | `{ url? }` | Open connection |
| `sse.disconnect` | `{}` | Close connection |

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-bus.mjs';
    import './pan-sse.mjs';
    import { PanClient } from './pan-client.mjs';

    customElements.whenDefined('pan-bus').then(() => {
      const pc = new PanClient();

      // Connection status
      pc.subscribe('sse.connected', (msg) => {
        document.getElementById('status').textContent = 'Streaming';
        document.getElementById('status').style.color = 'green';
      });

      pc.subscribe('sse.disconnected', (msg) => {
        document.getElementById('status').textContent = 'Stopped';
        document.getElementById('status').style.color = 'red';
      });

      // Receive default messages
      pc.subscribe('sse.message', (msg) => {
        addLog('message', msg.data);
      });

      // Receive custom event types
      pc.subscribe('sse.event.update', (msg) => {
        addLog('update', msg.data);
      });

      pc.subscribe('sse.event.notification', (msg) => {
        addLog('notification', msg.data);
      });

      function addLog(type, data) {
        const log = document.getElementById('log');
        const entry = document.createElement('div');
        entry.innerHTML = `<strong>${type}:</strong> ${JSON.stringify(data)}`;
        log.prepend(entry);
      }

      window.startStream = () => pc.publish('sse.connect', {});
      window.stopStream = () => pc.publish('sse.disconnect', {});
    });
  </script>
</head>
<body>
  <pan-bus></pan-bus>
  <pan-sse url="https://api.example.com/events" auto-connect="false"></pan-sse>

  <div>
    <h2>SSE Demo</h2>
    Status: <span id="status">Stopped</span>
    <button onclick="startStream()">Start</button>
    <button onclick="stopStream()">Stop</button>

    <h3>Event Log</h3>
    <div id="log"></div>
  </div>
</body>
</html>
```

### Errors

pan-sse publishes errors to `sse.error` topic:

| Error Condition | Cause | Resolution |
|-----------------|-------|------------|
| `CONNECTION_FAILED` | Cannot connect to SSE endpoint | Check URL and server availability |
| `CONNECTION_CLOSED` | Stream closed unexpectedly | Check server logs, SSE auto-reconnects |
| `PARSE_ERROR` | Cannot parse event data | Check server event format |
| `INVALID_URL` | SSE URL is invalid | Use valid HTTP/HTTPS URL |
| `NOT_SUPPORTED` | Browser doesn't support SSE | Use modern browser or provide fallback |

**Error handling example**:
```javascript
import { PanClient } from './pan-client.mjs';

const pc = new PanClient();

// Subscribe to errors
pc.subscribe('sse.error', (msg) => {
  const { error, readyState, url } = msg.data;
  console.error('SSE Error:', error);

  if (error.includes('CONNECTION_FAILED')) {
    // Retry with exponential backoff
    setTimeout(() => {
      pc.publish('sse.connect', { url });
    }, 5000);
  }

  if (error.includes('NOT_SUPPORTED')) {
    // Fall back to polling
    console.warn('SSE not supported, using polling fallback');
    startPolling();
  }

  if (error.includes('PARSE_ERROR')) {
    // Log parse errors but continue streaming
    console.error('Invalid event format, skipping');
  }
});

// Monitor connection lifecycle
pc.subscribe('sse.connected', (msg) => {
  console.log('SSE streaming from:', msg.data.url);
  showStreamingStatus(true);
});

pc.subscribe('sse.disconnected', () => {
  console.log('SSE stream stopped');
  showStreamingStatus(false);
});

// Handle connection drops gracefully
let eventCount = 0;
let lastEventTime = Date.now();

pc.subscribe('sse.message', (msg) => {
  eventCount++;
  lastEventTime = Date.now();
});

// Check for stale connection
setInterval(() => {
  const timeSinceLastEvent = Date.now() - lastEventTime;
  
  if (timeSinceLastEvent > 60000) { // 60 seconds
    console.warn('No events received recently, reconnecting...');
    pc.publish('sse.disconnect', {});
    setTimeout(() => pc.publish('sse.connect', {}), 1000);
  }
}, 30000);

// Fallback to polling if SSE unavailable
function startPolling() {
  setInterval(async () => {
    try {
      const res = await fetch('/api/events?since=' + lastEventTime);
      const events = await res.json();
      events.forEach(event => {
        pc.publish('sse.message', event);
      });
    } catch (err) {
      console.error('Polling failed:', err);
    }
  }, 5000);
}

// Graceful degradation for older browsers
if (!('EventSource' in window)) {
  console.warn('SSE not supported, using polling');
  startPolling();
} else {
  pc.publish('sse.connect', { url: '/api/events' });
}
```

**Browser Compatibility**:

- SSE (EventSource API) supported in all modern browsers
- Not available in IE11 (use polyfill or fallback to polling)
- Check support: `if ('EventSource' in window)`
- Automatic reconnection is built into the EventSource API
- Maximum reconnection delay: typically 3 seconds

**Server Requirements**:

- Must send `Content-Type: text/event-stream`
- Must send `Cache-Control: no-cache`
- Keep connection open (don't close after each event)
- Send `:\n\n` (comment) every 15-30 seconds to keep alive
- Event format: `data: {...}\n\n` or `event: type\ndata: {...}\n\n`

### Common Issues

**Connection closes immediately**: Server must keep connection open with proper headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`.

**Events not received**: Check event format. Default events use `data:` prefix. Custom events use `event: type` followed by `data:`.

**CORS errors**: Configure CORS headers on server. Use `with-credentials="true"` for authenticated streams.

**No reconnection**: SSE automatically reconnects. To prevent, call `disconnect()` before page unload.

---

## Summary

This chapter documented LARC's integration components:

- **pan-data-connector**: REST API integration with CRUD pattern
- **pan-graphql-connector**: GraphQL query and mutation bridge
- **pan-websocket**: Bidirectional WebSocket communication
- **pan-sse**: Server-Sent Events streaming

All components transform external protocols into PAN bus messages, maintaining architectural consistency.

**See Also**:

- Tutorial: *Learning LARC* Chapter 11
- Core components: Chapter 17
- Data components: Chapter 18
- Authentication patterns: Appendix B
