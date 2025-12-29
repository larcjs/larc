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
| `list-path` | String | "/${resource}" | List endpoint template |
| `item-path` | String | "/${resource}/:id" | Item endpoint template |
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
| `${resource}.list.get` | `{ ...query }` | GET /${resource} | Fetch list |
| `${resource}.item.get` | `{ id }` | GET /${resource}/:id | Fetch single item |
| `${resource}.item.save` | `{ id?, ...data }` | POST or PUT | Create/update item |
| `${resource}.item.delete` | `{ id }` | DELETE /${resource}/:id | Delete item |

#### Published (Responses)

| Topic | Data | Description |
|-------|------|-------------|
| `${resource}.list.state` | `{ items: [...], meta? }` | List results (retained) |
| `${resource}.item.state.${id}` | `{ ...item }` | Single item (retained) |
| `${resource}.error` | `{ operation, error, status }` | Error occurred |

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

| Method | Parameters | Description |
|--------|-----------|-------------|
| `connect()` | - | Open WebSocket connection |
| `disconnect()` | - | Close connection |
| `send(data)` | data: Any | Send message (auto-serializes JSON) |

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

| Method | Parameters | Description |
|--------|-----------|-------------|
| `connect()` | - | Open SSE connection |
| `disconnect()` | - | Close connection |

### PAN Topics

#### Published

| Topic | Data | Description |
|-------|------|-------------|
| `sse.connected` | `{ url }` | Connection opened |
| `sse.disconnected` | `{}` | Connection closed |
| `sse.message` | `{ data, id?, type? }` | Default message event |
| `sse.event.${type}` | `{ data, id? }` | Custom event type |
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
