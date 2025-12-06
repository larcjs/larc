# Chapter 24: Integration Components

*In which we bridge the gap between LARC applications and the outside world—REST APIs, GraphQL servers, WebSocket streams, and Server-Sent Events—without losing our composure or our data*

Every modern web application is, at heart, an integration problem. You're not building a standalone fortress; you're building a trading post that speaks multiple languages, accepts multiple currencies, and somehow keeps track of what goes in and what goes out. Your frontend needs to talk to REST APIs, subscribe to real-time WebSocket feeds, execute GraphQL queries, and listen to Server-Sent Event streams—often simultaneously.

LARC's integration components solve this problem by providing declarative, PAN-bus-connected adapters for external data sources. They transform HTTP requests, WebSocket events, and SSE streams into PAN messages, and PAN messages back into network requests. The result is a clean architectural boundary: your application components remain blissfully unaware of whether their data comes from REST, GraphQL, or a carrier pigeon.

This chapter provides comprehensive API documentation for four integration components:

- **pan-data-connector**: REST API integration with full CRUD support
- **pan-graphql-connector**: GraphQL query and mutation bridge
- **pan-websocket**: Bidirectional WebSocket communication
- **pan-sse**: Server-Sent Events streaming

Each section follows the same structure: overview, usage guidance, installation, attribute/method/event reference, complete examples, and troubleshooting. Think of this chapter as your field guide to connecting LARC applications to the wider internet ecosystem.

## pan-data-connector

### Overview

`pan-data-connector` is a declarative REST API bridge that maps PAN bus topics to HTTP endpoints. It implements the standard CRUD pattern—list, get, create, update, delete—using fetch() and publishes responses as retained PAN messages. This allows components to request data via topics without knowing anything about HTTP methods, URL construction, or response handling.

The connector listens for request topics like `${resource}.list.get` and `${resource}.item.save`, performs the appropriate HTTP request, and publishes state updates to `${resource}.list.state` and `${resource}.item.state.${id}`. All state messages are retained, so late-subscribing components receive the most recent data immediately.

### When to Use

**Use `pan-data-connector` when:**
- Working with RESTful APIs that follow standard CRUD patterns
- You want declarative data fetching without writing fetch() calls in every component
- You need automatic state synchronization across multiple components
- You're building admin interfaces, CRUD applications, or data management tools
- Your API uses predictable URL patterns (e.g., `/api/users`, `/api/users/:id`)

**Don't use `pan-data-connector` when:**
- Your API doesn't follow REST conventions (use custom fetch() or build a specialized connector)
- You need fine-grained control over request timing and caching
- Your endpoints use non-standard HTTP methods or complex request patterns
- You're working with GraphQL (use `pan-graphql-connector` instead)

### Installation and Setup

Include the component module and add it to your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module" src="/ui/src/components/pan-bus.mjs"></script>
  <script type="module" src="/ui/src/components/pan-data-connector.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <!-- Simple configuration -->
  <pan-data-connector
    resource="users"
    base-url="https://api.example.com">
  </pan-data-connector>

  <!-- Your application -->
</body>
</html>
```

For APIs requiring authentication headers:

```html
<pan-data-connector
  resource="users"
  base-url="https://api.example.com"
  credentials="include">
  <script type="application/json">
    {
      "headers": {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "X-API-Version": "2023-01"
      }
    }
  </script>
</pan-data-connector>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `resource` | String | `"items"` | Logical resource name. Used as the topic prefix (e.g., `users` creates topics like `users.list.get`). |
| `base-url` | String | `""` | Base URL for API endpoints. Trailing slashes are automatically removed. |
| `key` | String | `"id"` | The field name used as the unique identifier for items. |
| `list-path` | String | `"/${resource}"` | URL path template for list operations. Override for non-standard endpoints. |
| `item-path` | String | `"/${resource}/:id"` | URL path template for single-item operations. The `:id` placeholder is replaced with the actual ID. |
| `update-method` | String | `"PUT"` | HTTP method for updates. Use `"PATCH"` for partial updates. |
| `credentials` | String | `""` | Fetch credentials mode: `"include"`, `"same-origin"`, or `"omit"`. |

**Example configurations:**

```html
<!-- Non-standard paths -->
<pan-data-connector
  resource="products"
  base-url="https://shop.example.com"
  list-path="/v2/catalog/products"
  item-path="/v2/catalog/products/:id">
</pan-data-connector>

<!-- UUID-based API -->
<pan-data-connector
  resource="orders"
  base-url="/api"
  key="uuid"
  update-method="PATCH">
</pan-data-connector>

<!-- Complex authentication -->
<pan-data-connector resource="documents" base-url="/api/v1">
  <script type="application/json">
    {
      "headers": {
        "Authorization": "Bearer ${TOKEN}",
        "X-Tenant-ID": "acme-corp",
        "Accept": "application/vnd.api+json"
      }
    }
  </script>
</pan-data-connector>
```

### Topics

The connector listens to and publishes messages on the following topics:

#### Subscribed Topics (Requests)

**`${resource}.list.get`**

Fetches the list of items. Query parameters can be passed in the message data.

Request payload:
```javascript
{
  // Optional: any query parameters
  page: 1,
  limit: 20,
  filter: 'active'
}
```

**`${resource}.item.get`**

Fetches a single item by ID.

Request payload:
```javascript
{
  id: 123
}
// Or simply: 123
```

**`${resource}.item.save`**

Creates a new item (if no ID) or updates an existing item.

Request payload:
```javascript
{
  item: {
    id: 123,  // Optional; omit for creation
    name: "New Product",
    price: 29.99
  }
}
// Or simply: { id: 123, name: "...", price: 29.99 }
```

**`${resource}.item.delete`**

Deletes an item by ID.

Request payload:
```javascript
{
  id: 123
}
// Or simply: 123
```

#### Published Topics (Responses)

**`${resource}.list.state`** (retained)

Published after successful list fetch. Contains the current list of items.

Payload:
```javascript
{
  items: [
    { id: 1, name: "Product A", price: 19.99 },
    { id: 2, name: "Product B", price: 29.99 }
  ]
}
```

**`${resource}.item.state.${id}`** (retained)

Published after successful item fetch or save. Contains the current item state.

Payload:
```javascript
{
  item: {
    id: 123,
    name: "Product C",
    price: 39.99,
    updatedAt: "2024-01-15T10:30:00Z"
  }
}
```

For deletions, a non-retained deletion notification is published:
```javascript
{
  id: 123,
  deleted: true
}
```

#### Reply Topics

If the request includes `replyTo` and `correlationId` fields, the connector publishes a response to the reply topic:

Success response:
```javascript
{
  ok: true,
  items: [...],  // For list operations
  item: {...}    // For item operations
}
```

Error response:
```javascript
{
  ok: false,
  error: {
    status: 404,
    statusText: "Not Found",
    body: { message: "Item not found" }
  }
}
```

### Authentication Integration

`pan-data-connector` automatically integrates with LARC's authentication system. It subscribes to `auth.internal.state` (retained) and automatically injects `Authorization: Bearer ${token}` headers when a token is available.

This means you can configure authentication once in `pan-auth-provider`, and all connectors automatically include credentials:

```html
<pan-auth-provider
  storage="local"
  token-key="app_token">
</pan-auth-provider>

<!-- This connector will automatically use the auth token -->
<pan-data-connector
  resource="users"
  base-url="https://api.example.com">
</pan-data-connector>
```

### Complete Examples

#### Basic CRUD Application

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module" src="/ui/src/components/pan-bus.mjs"></script>
  <script type="module" src="/ui/src/components/pan-data-connector.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <pan-data-connector
    resource="todos"
    base-url="/api">
  </pan-data-connector>

  <div id="app"></div>

  <script type="module">
    const bus = document.querySelector('pan-bus');

    // Subscribe to list state
    bus.subscribe('todos.list.state', (msg) => {
      const todos = msg.data.items;
      renderTodoList(todos);
    });

    // Fetch initial list
    bus.publish('todos.list.get', {});

    function renderTodoList(todos) {
      const app = document.getElementById('app');
      app.innerHTML = `
        <h1>Todo List</h1>
        <ul>
          ${todos.map(todo => `
            <li>
              ${todo.title}
              <button onclick="completeTodo(${todo.id})">Done</button>
              <button onclick="deleteTodo(${todo.id})">Delete</button>
            </li>
          `).join('')}
        </ul>
        <form onsubmit="addTodo(event)">
          <input type="text" id="newTodo" placeholder="New todo...">
          <button type="submit">Add</button>
        </form>
      `;
    }

    window.addTodo = (event) => {
      event.preventDefault();
      const input = document.getElementById('newTodo');
      const title = input.value.trim();

      if (!title) return;

      bus.publish('todos.item.save', {
        item: { title, completed: false }
      });

      input.value = '';
    };

    window.completeTodo = (id) => {
      // Fetch current state, update, and save
      const unsub = bus.subscribe(`todos.item.state.${id}`, (msg) => {
        const todo = msg.data.item;
        bus.publish('todos.item.save', {
          item: { ...todo, completed: true }
        });
        unsub();
      }, { retained: true });

      bus.publish('todos.item.get', { id });
    };

    window.deleteTodo = (id) => {
      if (confirm('Delete this todo?')) {
        bus.publish('todos.item.delete', { id });
      }
    };
  </script>
</body>
</html>
```

#### Request-Response Pattern

For operations that need explicit confirmation:

```javascript
const bus = document.querySelector('pan-bus');

async function saveUser(userData) {
  return new Promise((resolve, reject) => {
    const correlationId = `save-${Date.now()}`;
    const replyTo = `app.reply.${correlationId}`;

    // Subscribe to reply
    const unsub = bus.subscribe(replyTo, (msg) => {
      unsub();
      if (msg.data.ok) {
        resolve(msg.data.item);
      } else {
        reject(new Error(msg.data.error.body?.message || 'Save failed'));
      }
    });

    // Send request with reply routing
    bus.publish('users.item.save', {
      item: userData,
      replyTo,
      correlationId
    });
  });
}

// Usage
try {
  const savedUser = await saveUser({ name: 'Alice', email: 'alice@example.com' });
  console.log('User saved:', savedUser);
} catch (error) {
  console.error('Failed to save user:', error);
}
```

#### Query Parameters and Filtering

```javascript
// Paginated list with filters
bus.publish('products.list.get', {
  page: 2,
  limit: 20,
  category: 'electronics',
  minPrice: 100,
  maxPrice: 1000,
  sort: 'price:asc'
});

// The connector converts this to:
// GET /api/products?page=2&limit=20&category=electronics&minPrice=100&maxPrice=1000&sort=price%3Aasc
```

### Related Components

- **pan-bus**: Required for message routing
- **pan-auth-provider**: Automatic authentication header injection
- **pan-store**: Can be used to cache connector state in memory
- **pan-idb**: Can persist connector state to IndexedDB for offline support

### Common Issues and Solutions

#### Issue: CORS Errors

**Symptom:** Browser console shows "Access-Control-Allow-Origin" errors.

**Solution:** Configure your server to include proper CORS headers, or use a proxy during development:

```javascript
// Development proxy in Vite config
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
}
```

#### Issue: Stale Data After Updates

**Symptom:** List doesn't reflect changes after creating/updating items.

**Solution:** The connector automatically refreshes the list after save/delete operations. If you need manual refresh:

```javascript
bus.publish('users.list.get', {});
```

#### Issue: 401 Unauthorized Errors

**Symptom:** Requests fail with 401 status after initial success.

**Solution:** Ensure your auth token is being refreshed. The connector automatically picks up new tokens from `auth.internal.state`:

```javascript
// When token is refreshed
bus.publish('auth.internal.state', {
  authenticated: true,
  token: newToken,
  user: { id: 123, name: 'Alice' }
}, { retain: true });
```

#### Issue: Slow Performance with Large Lists

**Symptom:** UI freezes when loading large datasets.

**Solution:** Implement pagination and avoid loading all items at once:

```javascript
// Load in pages
const PAGE_SIZE = 50;
let currentPage = 1;

function loadNextPage() {
  bus.publish('items.list.get', {
    page: currentPage,
    limit: PAGE_SIZE
  });
  currentPage++;
}
```

---

## pan-graphql-connector

### Overview

`pan-graphql-connector` bridges LARC's PAN bus to GraphQL APIs. It maps the same CRUD topic patterns as `pan-data-connector` but executes GraphQL queries and mutations instead of REST calls. You define your GraphQL operations as child `<script>` elements, and the connector handles execution, response parsing, and state publication.

This component is ideal for applications that interact with GraphQL APIs while maintaining architectural consistency with REST-based LARC applications.

### When to Use

**Use `pan-graphql-connector` when:**
- Your backend uses GraphQL instead of REST
- You want to leverage GraphQL's flexible query structure
- You need to fetch nested or related data in a single request
- Your API benefits from GraphQL's type system and introspection
- You're building against existing GraphQL services (GitHub, Shopify, etc.)

**Don't use `pan-graphql-connector` when:**
- Your backend uses REST (use `pan-data-connector`)
- You need real-time subscriptions (use `pan-websocket` with GraphQL subscription protocol)
- Your queries are so dynamic that templating won't work (write custom GraphQL clients)

### Installation and Setup

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="/ui/src/components/pan-bus.mjs"></script>
  <script type="module" src="/ui/src/components/pan-graphql-connector.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <pan-graphql-connector
    resource="users"
    endpoint="https://api.example.com/graphql"
    key="id">

    <!-- List query -->
    <script type="application/graphql" data-op="list">
      query GetUsers($limit: Int, $offset: Int) {
        users(limit: $limit, offset: $offset) {
          id
          name
          email
          createdAt
        }
      }
    </script>

    <!-- Single item query -->
    <script type="application/graphql" data-op="item">
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
          createdAt
          posts {
            id
            title
          }
        }
      }
    </script>

    <!-- Save mutation -->
    <script type="application/graphql" data-op="save">
      mutation SaveUser($id: ID, $item: UserInput!) {
        saveUser(id: $id, input: $item) {
          id
          name
          email
          createdAt
        }
      }
    </script>

    <!-- Delete mutation -->
    <script type="application/graphql" data-op="delete">
      mutation DeleteUser($id: ID!) {
        deleteUser(id: $id)
      }
    </script>

    <!-- Response path mapping -->
    <script type="application/json" data-paths>
      {
        "list": "data.users",
        "item": "data.user",
        "save": "data.saveUser",
        "delete": "data.deleteUser"
      }
    </script>
  </pan-graphql-connector>
</body>
</html>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `resource` | String | `"items"` | Logical resource name for topic prefixes. |
| `endpoint` | String | Required | GraphQL HTTP endpoint URL. |
| `key` | String | `"id"` | Field name used as the unique identifier. |

### GraphQL Operation Scripts

Define GraphQL operations as child `<script type="application/graphql">` elements:

**`data-op="list"`**

Executed when `${resource}.list.get` is published. Variables from the message data are passed to the query.

**`data-op="item"`**

Executed when `${resource}.item.get` is published. Receives `{ id }` as a variable.

**`data-op="save"`**

Executed when `${resource}.item.save` is published. Receives `{ id, item }` as variables (id is null for creation).

**`data-op="delete"`**

Executed when `${resource}.item.delete` is published. Receives `{ id }` as a variable.

### Response Path Mapping

The `<script type="application/json" data-paths>` element maps GraphQL response paths to data:

```json
{
  "list": "data.users",        // Path to array in list response
  "item": "data.user",          // Path to object in item response
  "save": "data.saveUser",      // Path to object in save response
  "delete": "data.deleteUser"   // Path to boolean/success indicator in delete response
}
```

Without path mapping, the connector attempts to extract data from the top-level `data` field.

### Topics

The topic structure is identical to `pan-data-connector`:

- **Listens:** `${resource}.list.get`, `${resource}.item.get`, `${resource}.item.save`, `${resource}.item.delete`
- **Publishes:** `${resource}.list.state`, `${resource}.item.state.${id}`
- **Reply support:** Same as `pan-data-connector`

### Authentication Integration

Like `pan-data-connector`, this component subscribes to `auth.internal.state` and automatically injects `Authorization: Bearer ${token}` headers.

### Complete Examples

#### GitHub API Integration

```html
<pan-graphql-connector
  resource="repos"
  endpoint="https://api.github.com/graphql"
  key="id">

  <script type="application/graphql" data-op="list">
    query GetRepositories($login: String!) {
      user(login: $login) {
        repositories(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            id
            name
            description
            url
            stargazerCount
            updatedAt
          }
        }
      }
    }
  </script>

  <script type="application/json" data-paths>
    {
      "list": "data.user.repositories.nodes"
    }
  </script>
</pan-graphql-connector>

<script type="module">
  const bus = document.querySelector('pan-bus');

  // Fetch repositories for a user
  bus.publish('repos.list.get', { login: 'torvalds' });

  bus.subscribe('repos.list.state', (msg) => {
    console.log('Repositories:', msg.data.items);
  });
</script>
```

#### Nested Data Fetching

```html
<pan-graphql-connector
  resource="posts"
  endpoint="/graphql"
  key="id">

  <script type="application/graphql" data-op="item">
    query GetPost($id: ID!) {
      post(id: $id) {
        id
        title
        content
        author {
          id
          name
          avatar
        }
        comments {
          id
          text
          author {
            name
          }
          createdAt
        }
        tags
      }
    }
  </script>

  <script type="application/json" data-paths>
    { "item": "data.post" }
  </script>
</pan-graphql-connector>
```

### Related Components

- **pan-bus**: Required for message routing
- **pan-data-connector**: REST equivalent
- **pan-auth-provider**: Automatic token injection
- **pan-websocket**: For GraphQL subscriptions over WebSocket

### Common Issues and Solutions

#### Issue: GraphQL Errors Not Surfaced

**Symptom:** Requests fail silently without clear error messages.

**Solution:** GraphQL returns errors in the `errors` array. The connector concatenates error messages. Check browser console for details:

```javascript
bus.subscribe('users.list.state', (msg) => {
  if (msg.data.items.length === 0) {
    console.warn('Empty result—check console for GraphQL errors');
  }
});
```

#### Issue: Response Path Incorrect

**Symptom:** Published state is empty even though GraphQL response contains data.

**Solution:** Verify your path mapping matches the response structure. Use browser DevTools Network tab to inspect the actual GraphQL response:

```json
// Response:
{
  "data": {
    "viewer": {
      "repositories": [...]
    }
  }
}

// Correct path:
{
  "list": "data.viewer.repositories"
}
```

#### Issue: Variables Not Passed Correctly

**Symptom:** GraphQL complains about missing required variables.

**Solution:** Ensure the query variable names match what you're passing in the PAN message:

```javascript
// Query expects $limit
query GetItems($limit: Int) { ... }

// Pass correct variable name
bus.publish('items.list.get', { limit: 50 });
```

---

## pan-websocket

### Overview

`pan-websocket` creates a bidirectional bridge between LARC's PAN bus and WebSocket servers. It forwards PAN messages to the WebSocket connection and publishes incoming WebSocket messages to the PAN bus. The component handles connection lifecycle, automatic reconnection with exponential backoff, heartbeat pings, and topic-based message filtering.

This enables real-time, full-duplex communication patterns: chat applications, live collaboration, gaming, IoT dashboards, and any scenario where both client and server need to push messages at will.

### When to Use

**Use `pan-websocket` when:**
- You need bidirectional real-time communication
- Both client and server need to initiate messages
- You're building chat, collaboration, or multiplayer features
- You need lower latency than HTTP polling or SSE
- Your server supports WebSocket protocol

**Don't use `pan-websocket` when:**
- You only need server-to-client updates (use `pan-sse` for simplicity)
- Your infrastructure doesn't support WebSocket (some proxies block them)
- You're working with simple request-response patterns (use `pan-data-connector`)
- You need guaranteed message delivery and ordering (WebSocket doesn't guarantee these; consider adding application-level acknowledgment)

### Installation and Setup

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="/ui/src/components/pan-bus.mjs"></script>
  <script type="module" src="/ui/src/components/pan-websocket.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <pan-websocket
    url="wss://api.example.com/ws"
    outbound-topics="chat.* user.typing"
    inbound-topics="chat.* user.* system.*"
    auto-reconnect="true"
    reconnect-delay="1000,15000"
    heartbeat="30"
    heartbeat-topic="sys.ping">
  </pan-websocket>
</body>
</html>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | String | Required | WebSocket server URL (must start with `ws://` or `wss://`). |
| `protocols` | String | `""` | Comma-separated list of WebSocket subprotocols. |
| `outbound-topics` | String | `""` | Space-separated topic patterns to forward from PAN bus to WebSocket. Empty means no topics are forwarded. |
| `inbound-topics` | String | `"*"` | Space-separated topic patterns to publish from WebSocket to PAN bus. Default `"*"` publishes all. |
| `auto-reconnect` | Boolean | `true` | Enable automatic reconnection on disconnect. |
| `reconnect-delay` | String | `"1000,15000"` | Min and max reconnection delay in milliseconds (exponential backoff). |
| `heartbeat` | Number | `30` | Seconds between heartbeat ping messages. Set to 0 to disable. |
| `heartbeat-topic` | String | `"sys.ping"` | Topic used for heartbeat messages. |

**Example configurations:**

```html
<!-- Chat application -->
<pan-websocket
  url="wss://chat.example.com"
  outbound-topics="chat.send user.typing"
  inbound-topics="chat.* presence.*">
</pan-websocket>

<!-- IoT dashboard -->
<pan-websocket
  url="wss://iot.example.com/devices"
  outbound-topics="device.command.*"
  inbound-topics="sensor.* device.status.*"
  heartbeat="10">
</pan-websocket>

<!-- Authentication with token -->
<pan-websocket
  url="wss://api.example.com/ws?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  outbound-topics="*"
  inbound-topics="*">
</pan-websocket>
```

### Topics

The connector publishes system lifecycle events:

**`ws.connected`**

Published when WebSocket connection is established.

Payload:
```javascript
{
  url: "wss://api.example.com/ws",
  timestamp: 1704444000000
}
```

**`ws.disconnected`**

Published when connection closes.

Payload:
```javascript
{
  code: 1000,           // WebSocket close code
  reason: "Normal closure",
  wasClean: true,       // Whether close was clean
  timestamp: 1704444100000
}
```

**`ws.error`**

Published when connection error occurs.

Payload:
```javascript
{
  error: "Connection refused",
  timestamp: 1704444050000
}
```

**`ws.message`**

Published for every incoming WebSocket message (before topic-specific publishing).

Payload:
```javascript
{
  message: { topic: "chat.message", data: {...} },
  timestamp: 1704444075000
}
```

Or for non-JSON messages:
```javascript
{
  raw: "plain text message",
  timestamp: 1704444075000
}
```

### Methods

Access the element to call methods programmatically:

```javascript
const ws = document.querySelector('pan-websocket');
```

**`send(data)`**

Sends data directly through the WebSocket connection.

Parameters:

- `data` (String | Object): Data to send. Objects are JSON-stringified automatically.

```javascript
ws.send({ topic: 'custom.event', data: { foo: 'bar' } });
ws.send('plain text message');
```

**`close()`**

Closes the WebSocket connection and disables auto-reconnect.

```javascript
ws.close();
```

**`reconnect()`**

Manually triggers reconnection (closes current connection and establishes new one).

```javascript
ws.reconnect();
```

### Message Format

Messages sent over WebSocket should follow this JSON structure:

```javascript
{
  topic: "event.name",
  data: { /* payload */ },
  ts: 1704444000000,   // Optional timestamp
  id: "msg-123"        // Optional message ID
}
```

The connector:

1. Checks if `message.topic` matches any `inbound-topics` patterns
2. Publishes to PAN bus as: `{ topic: message.topic, data: message.data, retain: message.retain }`

Outbound messages are forwarded in the same format.

### Complete Examples

#### Real-time Chat Application

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="/ui/src/components/pan-bus.mjs"></script>
  <script type="module" src="/ui/src/components/pan-websocket.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <pan-websocket
    url="wss://chat.example.com/room/general"
    outbound-topics="chat.send user.typing"
    inbound-topics="chat.* user.* presence.*">
  </pan-websocket>

  <div id="chat">
    <div id="messages"></div>
    <div id="typing"></div>
    <form id="chatForm">
      <input type="text" id="messageInput" placeholder="Type a message...">
      <button type="submit">Send</button>
    </form>
  </div>

  <script type="module">
    const bus = document.querySelector('pan-bus');
    const messagesDiv = document.getElementById('messages');
    const typingDiv = document.getElementById('typing');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('messageInput');

    // Subscribe to incoming messages
    bus.subscribe('chat.message', (msg) => {
      const { user, text, timestamp } = msg.data;
      appendMessage(user, text, timestamp);
    });

    // Subscribe to typing indicators
    bus.subscribe('user.typing', (msg) => {
      const { user, isTyping } = msg.data;
      updateTypingIndicator(user, isTyping);
    });

    // Subscribe to connection status
    bus.subscribe('ws.connected', () => {
      console.log('Chat connected');
    });

    bus.subscribe('ws.disconnected', () => {
      console.warn('Chat disconnected');
    });

    // Send message on form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();

      if (!text) return;

      bus.publish('chat.send', {
        text,
        user: getCurrentUser(),
        timestamp: Date.now()
      });

      input.value = '';
    });

    // Send typing indicator
    let typingTimeout;
    input.addEventListener('input', () => {
      bus.publish('user.typing', {
        user: getCurrentUser(),
        isTyping: true
      });

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        bus.publish('user.typing', {
          user: getCurrentUser(),
          isTyping: false
        });
      }, 2000);
    });

    function appendMessage(user, text, timestamp) {
      const time = new Date(timestamp).toLocaleTimeString();
      messagesDiv.innerHTML += `
        <div class="message">
          <strong>${user}</strong>
          <span class="time">${time}</span>
          <p>${text}</p>
        </div>
      `;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function updateTypingIndicator(user, isTyping) {
      if (isTyping) {
        typingDiv.textContent = `${user} is typing...`;
      } else {
        typingDiv.textContent = '';
      }
    }

    function getCurrentUser() {
      return localStorage.getItem('username') || 'Anonymous';
    }
  </script>
</body>
</html>
```

#### IoT Sensor Dashboard

```html
<pan-websocket
  url="wss://iot.example.com/stream"
  outbound-topics="device.control.*"
  inbound-topics="sensor.* device.status.*"
  heartbeat="10">
</pan-websocket>

<script type="module">
  const bus = document.querySelector('pan-bus');

  // Subscribe to all sensor updates
  bus.subscribe('sensor.*', (msg) => {
    const { deviceId, sensorType, value, unit } = msg.data;
    updateSensorDisplay(deviceId, sensorType, value, unit);
  });

  // Subscribe to device status
  bus.subscribe('device.status.*', (msg) => {
    const { deviceId, online, battery } = msg.data;
    updateDeviceStatus(deviceId, online, battery);
  });

  // Control device
  function controlDevice(deviceId, action) {
    bus.publish(`device.control.${deviceId}`, {
      action,
      timestamp: Date.now()
    });
  }

  // Example: Turn on device
  controlDevice('device-001', 'power:on');
</script>
```

### Related Components

- **pan-bus**: Required for message routing
- **pan-sse**: For unidirectional server-to-client streaming
- **pan-data-connector**: For request-response HTTP patterns
- **pan-graphql-connector**: For GraphQL over WebSocket subscriptions

### Common Issues and Solutions

#### Issue: Connection Keeps Dropping

**Symptom:** `ws.disconnected` events happen frequently.

**Solution:**
1. Check server-side WebSocket timeout configuration
2. Reduce `heartbeat` interval to keep connection alive
3. Verify firewall/proxy doesn't block WebSocket

```html
<pan-websocket
  url="wss://api.example.com/ws"
  heartbeat="15"
  reconnect-delay="500,5000">
</pan-websocket>
```

#### Issue: Messages Not Being Forwarded

**Symptom:** Messages published to PAN don't appear on WebSocket.

**Solution:** Ensure topics match `outbound-topics` patterns:

```html
<!-- Only forwards topics starting with "app." -->
<pan-websocket
  url="wss://api.example.com/ws"
  outbound-topics="app.*">
</pan-websocket>
```

```javascript
// This WILL be forwarded
bus.publish('app.user.update', { id: 123 });

// This will NOT be forwarded
bus.publish('other.event', { data: 'ignored' });
```

#### Issue: Reconnection Storms

**Symptom:** Many reconnection attempts happen too quickly, overwhelming server.

**Solution:** Increase minimum reconnection delay and maximum backoff:

```html
<pan-websocket
  url="wss://api.example.com/ws"
  reconnect-delay="5000,60000">
</pan-websocket>
```

This uses exponential backoff from 5 seconds to 60 seconds maximum.

---

## pan-sse

### Overview

`pan-sse` bridges Server-Sent Events (SSE) streams to LARC's PAN bus. It opens an EventSource connection, listens for server events, and publishes them as PAN messages. Unlike WebSocket, SSE is unidirectional (server to client) but simpler to implement, works over standard HTTP, and automatically reconnects on failure.

SSE is ideal for live feeds, notification streams, real-time dashboards, and any scenario where the server pushes updates but the client only sends occasional HTTP requests.

### When to Use

**Use `pan-sse` when:**
- You only need server-to-client real-time updates
- Your infrastructure doesn't support WebSocket
- You want automatic reconnection built into the browser
- Your server can stream `text/event-stream` responses
- You're building live feeds, notifications, or monitoring dashboards

**Don't use `pan-sse` when:**
- You need bidirectional communication (use `pan-websocket`)
- You need to send frequent client-to-server messages (SSE doesn't support that)
- Your server doesn't support persistent HTTP connections
- You need binary data streaming (SSE is text-only)

### Installation and Setup

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="/ui/src/components/pan-bus.mjs"></script>
  <script type="module" src="/ui/src/components/pan-sse.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <pan-sse
    src="/api/events"
    topics="user.* system.notification"
    with-credentials="true"
    persist-last-event="app-events"
    backoff="1000,10000">
  </pan-sse>
</body>
</html>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | String | Required | SSE endpoint URL. Must return `Content-Type: text/event-stream`. |
| `topics` | String | `""` | Space-separated list of topics to subscribe to. Appended as `?topics=topic1,topic2`. |
| `with-credentials` | Boolean | `true` | Include credentials (cookies) with EventSource request. |
| `persist-last-event` | String | `""` | localStorage key to persist last event ID. On reconnect, sends `?lastEventId=...` to resume stream. |
| `backoff` | String | `"1000,15000"` | Min and max reconnection delay in milliseconds. Uses jittered exponential backoff. |

**Example configurations:**

```html
<!-- Live notification feed -->
<pan-sse
  src="https://api.example.com/notifications"
  topics="notification.new"
  persist-last-event="notifications">
</pan-sse>

<!-- Stock price updates -->
<pan-sse
  src="/api/stocks/stream"
  topics="stock.price stock.trade"
  with-credentials="false">
</pan-sse>

<!-- Server monitoring -->
<pan-sse
  src="https://monitor.example.com/events"
  topics="server.* alert.*"
  persist-last-event="monitoring"
  backoff="2000,30000">
</pan-sse>
```

### Server-Side SSE Format

Your server should send events in this format:

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

id: 123
event: notification.new
data: {"userId":456,"message":"You have a new message"}

id: 124
event: user.login
data: {"userId":789,"timestamp":1704444000000}

id: 125
data: {"topic":"system.status","status":"ok"}
```

- **`id:`** Optional event ID for resumption (used with `persist-last-event`)
- **`event:`** Optional event type (becomes PAN topic if provided)
- **`data:`** Event payload (JSON parsed automatically)

If no `event:` field is provided, the connector looks for `topic` in the JSON data.

### Topics

The connector doesn't publish system lifecycle events by default. It simply forwards server events to PAN bus topics.

Events are published as:
```javascript
{
  topic: eventType || data.topic,
  data: data.data || data.payload || data,
  retain: data.retain || false
}
```

### Complete Examples

#### Live Notification Feed

Server (Node.js Express):
```javascript
app.get('/api/notifications', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial event
  res.write(`id: ${Date.now()}\n`);
  res.write(`event: notification.init\n`);
  res.write(`data: {"status":"connected"}\n\n`);

  // Subscribe to notification system
  const unsubscribe = notificationService.subscribe((notification) => {
    res.write(`id: ${notification.id}\n`);
    res.write(`event: notification.new\n`);
    res.write(`data: ${JSON.stringify(notification)}\n\n`);
  });

  // Cleanup on disconnect
  req.on('close', () => {
    unsubscribe();
    res.end();
  });
});
```

Client:
```html
<pan-sse
  src="/api/notifications"
  persist-last-event="notifications">
</pan-sse>

<div id="notifications"></div>

<script type="module">
  const bus = document.querySelector('pan-bus');
  const container = document.getElementById('notifications');

  bus.subscribe('notification.new', (msg) => {
    const { userId, message, timestamp } = msg.data;

    const div = document.createElement('div');
    div.className = 'notification';
    div.innerHTML = `
      <span class="time">${new Date(timestamp).toLocaleTimeString()}</span>
      <p>${message}</p>
    `;

    container.prepend(div);

    // Auto-remove after 10 seconds
    setTimeout(() => div.remove(), 10000);
  });
</script>
```

#### Real-time Analytics Dashboard

Server:
```javascript
app.get('/api/analytics/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send metrics every 5 seconds
  const interval = setInterval(() => {
    const metrics = {
      activeUsers: getActiveUserCount(),
      requestsPerSecond: getRequestRate(),
      errorRate: getErrorRate(),
      timestamp: Date.now()
    };

    res.write(`event: analytics.metrics\n`);
    res.write(`data: ${JSON.stringify(metrics)}\n\n`);
  }, 5000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});
```

Client:
```html
<pan-sse src="/api/analytics/stream"></pan-sse>

<script type="module">
  const bus = document.querySelector('pan-bus');

  bus.subscribe('analytics.metrics', (msg) => {
    const { activeUsers, requestsPerSecond, errorRate } = msg.data;

    updateChart('users', activeUsers);
    updateChart('requests', requestsPerSecond);
    updateChart('errors', errorRate);
  });
</script>
```

#### Multi-Topic Subscription

```html
<pan-sse
  src="/api/events"
  topics="user.login user.logout order.created order.shipped"
  persist-last-event="app-events">
</pan-sse>

<script type="module">
  const bus = document.querySelector('pan-bus');

  // Subscribe to user events
  bus.subscribe('user.*', (msg) => {
    console.log('User event:', msg.topic, msg.data);
  });

  // Subscribe to order events
  bus.subscribe('order.*', (msg) => {
    console.log('Order event:', msg.topic, msg.data);
  });
</script>
```

The `topics` attribute sends `?topics=user.login,user.logout,order.created,order.shipped` to the server, allowing it to filter events before streaming.

### Related Components

- **pan-bus**: Required for message routing
- **pan-websocket**: For bidirectional communication
- **pan-data-connector**: For request-response patterns
- **pan-store**: Can cache streamed data in memory

### Common Issues and Solutions

#### Issue: EventSource Connection Fails Silently

**Symptom:** No events received, no error messages.

**Solution:** Check server CORS headers and Content-Type:

```javascript
// Server must include:
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
res.setHeader('Access-Control-Allow-Origin', 'https://your-client.com');
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

#### Issue: Lost Events After Reconnect

**Symptom:** Gaps in data stream after network interruption.

**Solution:** Use `persist-last-event` and implement server-side event replay:

```html
<pan-sse
  src="/api/events"
  persist-last-event="events">
</pan-sse>
```

Server checks `?lastEventId` query parameter:
```javascript
app.get('/api/events', (req, res) => {
  const lastEventId = req.query.lastEventId;

  if (lastEventId) {
    // Replay missed events since lastEventId
    const missedEvents = getEventsSince(lastEventId);
    missedEvents.forEach(event => {
      res.write(`id: ${event.id}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });
  }

  // Continue with live stream
  // ...
});
```

#### Issue: Memory Leak from Long-Running Streams

**Symptom:** Browser memory usage grows over time.

**Solution:** The component automatically handles cleanup on disconnect. Ensure you're not accumulating DOM nodes in your subscription handlers:

```javascript
bus.subscribe('analytics.metrics', (msg) => {
  // BAD: Keeps appending without limit
  container.innerHTML += `<div>${msg.data.value}</div>`;

  // GOOD: Limit number of displayed items
  const div = document.createElement('div');
  div.textContent = msg.data.value;
  container.prepend(div);

  // Keep only last 100 items
  while (container.children.length > 100) {
    container.lastChild.remove();
  }
});
```

---

## Architectural Patterns

### Combining Multiple Connectors

Real-world applications often use multiple integration patterns simultaneously. Here's how to orchestrate them effectively:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="/ui/src/components/pan-bus.mjs"></script>
  <script type="module" src="/ui/src/components/pan-auth-provider.mjs"></script>
  <script type="module" src="/ui/src/components/pan-data-connector.mjs"></script>
  <script type="module" src="/ui/src/components/pan-websocket.mjs"></script>
  <script type="module" src="/ui/src/components/pan-sse.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <!-- Authentication -->
  <pan-auth-provider
    storage="local"
    token-key="app_token">
  </pan-auth-provider>

  <!-- REST API for CRUD operations -->
  <pan-data-connector
    resource="documents"
    base-url="https://api.example.com">
  </pan-data-connector>

  <!-- WebSocket for real-time collaboration -->
  <pan-websocket
    url="wss://collab.example.com/ws"
    outbound-topics="document.edit.*"
    inbound-topics="document.edit.* user.cursor.*">
  </pan-websocket>

  <!-- SSE for notifications -->
  <pan-sse
    src="https://api.example.com/notifications"
    topics="notification.*"
    persist-last-event="notifications">
  </pan-sse>

  <div id="app"></div>

  <script type="module">
    const bus = document.querySelector('pan-bus');

    // Load initial document list via REST
    bus.publish('documents.list.get', { limit: 50 });

    // Subscribe to document state
    bus.subscribe('documents.list.state', (msg) => {
      renderDocumentList(msg.data.items);
    });

    // When user opens a document, subscribe to real-time edits
    function openDocument(id) {
      bus.publish('documents.item.get', { id });

      bus.subscribe(`document.edit.${id}`, (msg) => {
        applyRemoteEdit(msg.data);
      });

      bus.subscribe(`user.cursor.${id}`, (msg) => {
        updateCursorPosition(msg.data.userId, msg.data.position);
      });
    }

    // When user edits locally, broadcast via WebSocket
    function handleLocalEdit(documentId, edit) {
      bus.publish(`document.edit.${documentId}`, {
        userId: getCurrentUserId(),
        edit,
        timestamp: Date.now()
      });
    }

    // Subscribe to notifications via SSE
    bus.subscribe('notification.*', (msg) => {
      showNotification(msg.data);
    });

    // Save changes via REST when user stops editing
    async function saveDocument(documentId, content) {
      return new Promise((resolve, reject) => {
        const correlationId = `save-${Date.now()}`;
        const replyTo = `app.reply.${correlationId}`;

        const unsub = bus.subscribe(replyTo, (msg) => {
          unsub();
          msg.data.ok ? resolve(msg.data.item) : reject(msg.data.error);
        });

        bus.publish('documents.item.save', {
          item: { id: documentId, content },
          replyTo,
          correlationId
        });
      });
    }
  </script>
</body>
</html>
```

This architecture uses:

- **REST** for durable state (document CRUD)
- **WebSocket** for ephemeral real-time updates (cursor positions, live edits)
- **SSE** for server-initiated notifications (comments, mentions)

Each protocol handles what it does best, unified through PAN topics.

### Optimistic Updates with Rollback

When combining REST APIs with real-time updates, implement optimistic updates for better perceived performance:

```javascript
class DocumentEditor {
  constructor() {
    this.bus = document.querySelector('pan-bus');
    this.pendingUpdates = new Map();
  }

  async updateDocument(id, changes) {
    const updateId = `update-${Date.now()}-${Math.random()}`;

    // Apply changes optimistically
    this.applyChangesLocally(id, changes);

    // Track pending update
    this.pendingUpdates.set(updateId, { id, changes });

    try {
      // Send to server
      await this.saveToServer(id, changes);

      // Success: remove from pending
      this.pendingUpdates.delete(updateId);
    } catch (error) {
      // Failure: rollback
      console.error('Update failed, rolling back:', error);
      this.rollbackChanges(id, changes);
      this.pendingUpdates.delete(updateId);

      throw error;
    }
  }

  applyChangesLocally(id, changes) {
    // Update local state immediately
    const event = new CustomEvent('document-updated', {
      detail: { id, changes }
    });
    window.dispatchEvent(event);
  }

  rollbackChanges(id, changes) {
    // Revert local state
    const event = new CustomEvent('document-rollback', {
      detail: { id, changes }
    });
    window.dispatchEvent(event);
  }

  saveToServer(id, changes) {
    return new Promise((resolve, reject) => {
      const correlationId = `save-${Date.now()}`;
      const replyTo = `app.reply.${correlationId}`;

      const timeout = setTimeout(() => {
        unsub();
        reject(new Error('Save timeout'));
      }, 10000);

      const unsub = this.bus.subscribe(replyTo, (msg) => {
        clearTimeout(timeout);
        unsub();

        if (msg.data.ok) {
          resolve(msg.data.item);
        } else {
          reject(new Error(msg.data.error?.body?.message || 'Save failed'));
        }
      });

      this.bus.publish('documents.item.save', {
        item: { id, ...changes },
        replyTo,
        correlationId
      });
    });
  }
}
```

### Conflict Resolution

When multiple users edit the same document simultaneously, conflicts arise. Here's a simple last-write-wins strategy with vector clocks:

```javascript
class ConflictResolver {
  constructor(bus) {
    this.bus = bus;
    this.vectorClock = new Map();
  }

  handleRemoteEdit(documentId, edit) {
    const localVersion = this.vectorClock.get(documentId) || 0;
    const remoteVersion = edit.version || 0;

    if (remoteVersion > localVersion) {
      // Remote is newer: apply
      this.applyEdit(documentId, edit);
      this.vectorClock.set(documentId, remoteVersion);
    } else if (remoteVersion < localVersion) {
      // Local is newer: ignore
      console.log('Ignoring stale remote edit');
    } else {
      // Same version: conflict
      this.resolveConflict(documentId, edit);
    }
  }

  resolveConflict(documentId, remoteEdit) {
    // Strategy 1: Last-write-wins by timestamp
    const localTimestamp = this.getLocalTimestamp(documentId);
    if (remoteEdit.timestamp > localTimestamp) {
      this.applyEdit(documentId, remoteEdit);
    }

    // Strategy 2: Operational Transform (more complex)
    // Strategy 3: CRDT (Conflict-free Replicated Data Types)
    // Strategy 4: User-initiated merge
  }

  applyEdit(documentId, edit) {
    // Apply the edit to local state
    this.bus.publish(`document.local-update.${documentId}`, {
      edit,
      source: 'remote'
    });
  }

  getLocalTimestamp(documentId) {
    // Retrieve from local state
    return Date.now();
  }
}
```

### Offline Support

Combine connectors with service workers and IndexedDB for offline-first applications:

```javascript
// Service worker for offline caching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('app-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/ui/src/components/pan-bus.mjs',
        '/ui/src/components/pan-data-connector.mjs',
        '/app.js',
        '/styles.css'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Application code with offline queue
class OfflineQueue {
  constructor(bus) {
    this.bus = bus;
    this.queue = [];
    this.loadQueue();

    // Monitor connection status
    window.addEventListener('online', () => this.processQueue());
    window.addEventListener('offline', () => console.log('Offline mode'));

    // Intercept save operations when offline
    this.bus.subscribe('documents.item.save', (msg) => {
      if (!navigator.onLine) {
        this.queueOperation('save', msg.data);
        // Publish immediate optimistic success
        if (msg.replyTo) {
          this.bus.publish(msg.replyTo, {
            correlationId: msg.correlationId,
            data: { ok: true, item: msg.data.item, queued: true }
          });
        }
      }
    });
  }

  queueOperation(type, data) {
    this.queue.push({ type, data, timestamp: Date.now() });
    this.saveQueue();
  }

  async processQueue() {
    console.log(`Processing ${this.queue.length} queued operations...`);

    while (this.queue.length > 0 && navigator.onLine) {
      const operation = this.queue[0];

      try {
        await this.executeOperation(operation);
        this.queue.shift();
        this.saveQueue();
      } catch (error) {
        console.error('Failed to process queued operation:', error);
        break;
      }
    }
  }

  async executeOperation(operation) {
    switch (operation.type) {
      case 'save':
        this.bus.publish('documents.item.save', operation.data);
        break;
      case 'delete':
        this.bus.publish('documents.item.delete', operation.data);
        break;
    }
  }

  saveQueue() {
    localStorage.setItem('offline-queue', JSON.stringify(this.queue));
  }

  loadQueue() {
    try {
      const data = localStorage.getItem('offline-queue');
      this.queue = data ? JSON.parse(data) : [];
    } catch {
      this.queue = [];
    }
  }
}
```

### Rate Limiting and Backpressure

When dealing with high-frequency WebSocket or SSE streams, implement rate limiting to prevent UI overload:

```javascript
class RateLimitedSubscriber {
  constructor(bus, topic, handler, options = {}) {
    this.bus = bus;
    this.handler = handler;
    this.buffer = [];
    this.lastFlush = Date.now();
    this.flushInterval = options.interval || 100; // ms
    this.maxBatch = options.maxBatch || 50;

    this.unsub = bus.subscribe(topic, (msg) => {
      this.buffer.push(msg);

      // Flush if buffer is full
      if (this.buffer.length >= this.maxBatch) {
        this.flush();
      }
    });

    // Periodic flush
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  flush() {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, this.maxBatch);
    this.handler(batch);
    this.lastFlush = Date.now();
  }

  destroy() {
    clearInterval(this.timer);
    this.unsub();
    this.flush(); // Flush remaining
  }
}

// Usage
const subscriber = new RateLimitedSubscriber(
  bus,
  'sensor.temperature',
  (messages) => {
    console.log(`Received ${messages.length} temperature readings`);
    updateChart(messages);
  },
  { interval: 200, maxBatch: 100 }
);
```

### Security Considerations

#### Content Security Policy

When using WebSocket and SSE, configure CSP headers:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  connect-src 'self' wss://api.example.com https://api.example.com;
  script-src 'self' 'unsafe-inline';
">
```

#### Token Expiration Handling

Automatically refresh auth tokens before they expire:

```javascript
class TokenRefreshManager {
  constructor(bus) {
    this.bus = bus;
    this.refreshTimer = null;

    // Subscribe to auth state
    bus.subscribe('auth.internal.state', (msg) => {
      if (msg.data.authenticated) {
        this.scheduleRefresh(msg.data.expiresAt);
      }
    }, { retained: true });
  }

  scheduleRefresh(expiresAt) {
    clearTimeout(this.refreshTimer);

    const now = Date.now();
    const expiresIn = expiresAt - now;
    const refreshIn = Math.max(0, expiresIn - 60000); // Refresh 1 min before expiry

    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshIn);
  }

  async refreshToken() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      const { token, expiresAt } = await response.json();

      // Update auth state
      this.bus.publish('auth.internal.state', {
        authenticated: true,
        token,
        expiresAt
      }, { retain: true });

    } catch (error) {
      console.error('Token refresh failed:', error);
      // Redirect to login
      window.location.href = '/login';
    }
  }
}
```

#### Input Validation

Always validate data from external sources:

```javascript
function validateMessage(msg) {
  // Validate structure
  if (!msg || typeof msg !== 'object') {
    throw new Error('Invalid message structure');
  }

  if (typeof msg.topic !== 'string' || msg.topic.length === 0) {
    throw new Error('Missing or invalid topic');
  }

  // Validate data size
  const size = JSON.stringify(msg.data).length;
  if (size > 1048576) { // 1MB limit
    throw new Error('Message payload too large');
  }

  // Sanitize HTML if rendering user content
  if (msg.data.html) {
    msg.data.html = sanitizeHtml(msg.data.html);
  }

  return msg;
}

// Use in subscription handlers
bus.subscribe('chat.message', (msg) => {
  try {
    const validated = validateMessage(msg);
    displayChatMessage(validated.data);
  } catch (error) {
    console.error('Invalid message received:', error);
  }
});
```

---

## Summary

LARC's integration components transform network protocols into PAN messages, maintaining architectural consistency across diverse data sources:

- **pan-data-connector** handles REST APIs with standard CRUD patterns
- **pan-graphql-connector** executes GraphQL queries and mutations
- **pan-websocket** enables bidirectional real-time communication
- **pan-sse** streams server-sent events for unidirectional updates

All four components:

- Operate declaratively via HTML attributes
- Publish retained state messages for late subscribers
- Support request-response patterns with `replyTo`
- Integrate with LARC's authentication system
- Handle connection lifecycle and error recovery

By combining these components strategically, you can build sophisticated applications that handle REST CRUD, real-time collaboration, server notifications, and offline support—all through a unified message bus architecture. The network complexity stays at the boundary, while your application logic remains focused on business concerns.

Choose the right connector for each data source, implement appropriate patterns for conflict resolution and offline support, and let LARC's integration layer handle the protocol details. Your components simply publish and subscribe to topics, blissfully unaware of whether their data travels over HTTP, WebSocket, or SSE.
