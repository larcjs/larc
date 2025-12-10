# @larcjs/components-types

TypeScript type definitions for [@larcjs/components](https://github.com/larcjs/components).

## Installation

```bash
npm install @larcjs/components
npm install -D @larcjs/components-types @larcjs/core-types
```

## Usage

Import types alongside your LARC components:

```typescript
import type { PanRouter, PanStore, PanTable } from '@larcjs/components-types';

const router: PanRouter = document.querySelector('pan-router')!;
const store: PanStore<AppState> = document.querySelector('pan-store')!;
const table: PanTable = document.querySelector('pan-table')!;

// Fully typed!
router.navigate('/home');
store.setState({ user: { name: 'Alice' } });
table.setData(users);
```

## Why Separate Type Packages?

LARC follows a **zero-build** philosophy. The runtime packages are pure JavaScript with no dependencies or build step required. TypeScript support is **opt-in** via separate type packages.

**Benefits:**
- Zero-build users never download unnecessary type files
- Types can evolve independently from runtime code
- Keeps runtime packages lean and fast
- TypeScript users get full type safety

## Available Component Types

### Routing & Navigation
- **`PanRouter`** - Client-side routing with navigation
- **`PanLink`** - Link component for routing

### State Management
- **`PanStore<T>`** - Reactive state management
- **`PanIDB`** - IndexedDB persistence

### Data Display
- **`PanTable`** - Data table with sorting, filtering
- **`PanChart`** - Chart visualization
- **`PanPagination`** - Pagination controls

### Forms & Input
- **`PanForm`** - Form handling with validation
- **`PanSchemaForm`** - Dynamic forms from JSON schema
- **`PanDropdown`** - Dropdown select
- **`PanDatePicker`** - Date picker
- **`PanSearchBar`** - Search input
- **`PanValidation`** - Validation utilities
- **`FileUpload`** - File upload with drag-and-drop
- **`DragDropList`** - Sortable lists

### UI Components
- **`PanCard`** - Content card
- **`PanModal`** - Modal dialog
- **`PanTabs`** - Tabbed interface

### Content & Editing
- **`PanMarkdownEditor`** - Markdown editor
- **`PanMarkdownRenderer`** - Markdown renderer

### Data Connectivity
- **`PanDataConnector`** - REST API connector
- **`PanGraphQLConnector`** - GraphQL client
- **`PanWebSocket`** - WebSocket connection
- **`PanSSE`** - Server-sent events
- **`PanFetch`** - HTTP fetch wrapper

### Authentication & Security
- **`PanJWT`** - JWT token management

### Theming
- **`PanThemeProvider`** - Theme provider
- **`PanThemeToggle`** - Theme switcher

### Developer Tools
- **`PanInspector`** - PAN message inspector for debugging

### Advanced
- **`PanWorker`** - Web worker integration

## Examples

### Router

```typescript
import type { PanRouter } from '@larcjs/components-types';

const router: PanRouter = document.querySelector('pan-router')!;

// Navigate programmatically
router.navigate('/users/123');

// Get current route
const current = router.getCurrentRoute();
console.log(current.path, current.params);

// Register route handler
router.addRoute('/users/:id', (params) => {
  console.log('User ID:', params.id);
});
```

### Store

```typescript
import type { PanStore } from '@larcjs/components-types';

interface AppState {
  user: { name: string; email: string } | null;
  theme: 'light' | 'dark';
}

const store: PanStore<AppState> = document.querySelector('pan-store')!;

// Get current state
const state = store.getState();

// Update state
store.setState({
  user: { name: 'Alice', email: 'alice@example.com' }
});

// Subscribe to changes
const unsubscribe = store.subscribe((state) => {
  console.log('State changed:', state);
});
```

### Table

```typescript
import type { PanTable } from '@larcjs/components-types';

interface User {
  id: number;
  name: string;
  email: string;
}

const table: PanTable = document.querySelector('pan-table')!;

// Set data
const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

table.setData(users);

// Get selected rows
const selected = table.getSelectedRows();
```

### Form

```typescript
import type { PanForm } from '@larcjs/components-types';

const form: PanForm = document.querySelector('pan-form')!;

// Get form data
const data = form.getData();
console.log(data);

// Set form data
form.setData({
  name: 'Alice',
  email: 'alice@example.com'
});

// Validate
if (form.validate()) {
  console.log('Form is valid!');
}

// Reset
form.reset();
```

### WebSocket

```typescript
import type { PanWebSocket } from '@larcjs/components-types';

const ws: PanWebSocket = document.querySelector('pan-websocket')!;

// Connect
ws.connect('wss://example.com/socket');

// Check connection
if (ws.isConnected()) {
  // Send message
  ws.send({ type: 'ping', data: {} });
}

// Disconnect
ws.disconnect();
```

### JWT

```typescript
import type { PanJWT } from '@larcjs/components-types';

const jwt: PanJWT = document.querySelector('pan-jwt')!;

// Set token
jwt.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// Get token
const token = jwt.getToken();

// Decode token
const payload = jwt.decode();
console.log(payload);

// Check expiration
if (jwt.isExpired()) {
  console.log('Token expired, please login');
  jwt.clearToken();
}
```

## Base Component Type

All LARC components extend the `LarcComponent` interface:

```typescript
import type { LarcComponent } from '@larcjs/components-types';
import type { PanClient } from '@larcjs/core-types';

const component: LarcComponent = document.querySelector('my-component')!;

// All components have these standard methods
component.connectedCallback?.();
component.disconnectedCallback?.();
component.attributeChangedCallback?.('attr', 'old', 'new');

// Most components include a PAN client
if (component.client) {
  component.client.publish({ topic: 'event', data: {} });
}
```

## Creating Custom Types

For components not yet typed, you can create your own type definitions:

```typescript
import type { LarcComponent } from '@larcjs/components-types';

interface MyCustomComponent extends LarcComponent {
  // Add your component's public API
  myMethod(): void;
  myProperty: string;
}

// Use it
const custom: MyCustomComponent = document.querySelector('my-custom-component')!;
custom.myMethod();
```

## Type-Only Imports

Use `import type` to import types without importing runtime code:

```typescript
// This adds NO runtime code
import type {
  PanRouter,
  PanStore,
  PanTable
} from '@larcjs/components-types';

// This is the actual runtime import
import '@larcjs/components/pan-router.mjs';

const router: PanRouter = document.querySelector('pan-router')!;
```

## VS Code IntelliSense

Even if you're writing plain JavaScript, you'll get autocomplete and type hints in VS Code when `@larcjs/components-types` is installed:

```javascript
// JavaScript file
const router = document.querySelector('pan-router');

router.nav // VS Code suggests "navigate"
router.navigate('/home'); // VS Code shows method signature
```

## Component Coverage

This package provides type definitions for the most commonly used LARC components. The complete list of 49 components includes:

- ✅ **Typed (24 components)**: Router, Store, Table, Form, Modal, Card, Tabs, Dropdown, DatePicker, WebSocket, SSE, JWT, ThemeProvider, ThemeToggle, Pagination, SearchBar, MarkdownEditor, MarkdownRenderer, Chart, FileUpload, DragDropList, DataConnector, GraphQLConnector, IDB, SchemaForm, Validation, Worker, Link, Fetch, Inspector

- 📝 **Extend yourself (25 components)**: Other specialized components can use the base `LarcComponent` type or you can create custom interfaces as needed.

## Related Packages

- **[@larcjs/components](https://github.com/larcjs/components)** — UI component library
- **[@larcjs/core-types](https://github.com/larcjs/core-types)** — Type definitions for LARC Core
- **[@larcjs/core](https://github.com/larcjs/core)** — Core PAN messaging bus

## License

MIT

## Links

- [LARC Components](https://github.com/larcjs/components)
- [LARC Documentation](https://larcjs.com)
- [Report Issues](https://github.com/larcjs/components-types/issues)
