# @larcjs/core-types

TypeScript type definitions for [@larcjs/core](https://github.com/larcjs/core).

## Installation

```bash
npm install @larcjs/core
npm install -D @larcjs/core-types
```

## Usage

Import types alongside your LARC code:

```typescript
import { PanClient } from '@larcjs/core/pan-client.mjs';
import type { PanMessage, SubscribeOptions } from '@larcjs/core-types';

const client = new PanClient();

// Fully typed!
client.subscribe<{ userId: number }>('user.updated', (msg: PanMessage) => {
  console.log(msg.data.userId); // TypeScript knows this is a number
});
```

## Why Separate Type Packages?

LARC follows a **zero-build** philosophy. The core packages are pure JavaScript with no dependencies or build step required. TypeScript support is **opt-in** via separate type packages.

**Benefits:**
- Zero-build users never download unnecessary type files
- Types can evolve independently from runtime code
- Keeps core packages lean and fast
- TypeScript users get full type safety

## Available Types

### Message Types

```typescript
import type {
  PanMessage,
  SubscribeOptions,
  RequestOptions
} from '@larcjs/core-types';

interface PanMessage<T = any> {
  topic: string;
  data: T;
  id?: string;
  ts?: number;
  retain?: boolean;
  replyTo?: string;
  correlationId?: string;
  headers?: Record<string, string>;
}
```

### Subscription Types

```typescript
import type {
  MessageHandler,
  UnsubscribeFunction
} from '@larcjs/core-types';

type MessageHandler<T = any> = (message: PanMessage<T>) => void;
type UnsubscribeFunction = () => void;
```

### Configuration Types

```typescript
import type { AutoloadConfig } from '@larcjs/core-types';

interface AutoloadConfig {
  baseUrl?: string | null;
  componentsPath?: string;
  extension?: string;
  rootMargin?: number;
  componentPaths?: Record<string, string>;
  // ... more options
}
```

### Component Types

```typescript
import type { PanClient, PanBus } from '@larcjs/core-types';

// PanClient class with full type definitions
const client: PanClient = new PanClient();

// PanBus element type
const bus: PanBus = document.querySelector('pan-bus')!;
```

## Examples

### Basic Pub/Sub with Types

```typescript
import { PanClient } from '@larcjs/core/pan-client.mjs';
import type { PanMessage } from '@larcjs/core-types';

interface UserData {
  id: number;
  name: string;
  email: string;
}

const client = new PanClient();

// Publish with typed data
client.publish<UserData>({
  topic: 'user.updated',
  data: {
    id: 123,
    name: 'Alice',
    email: 'alice@example.com'
  }
});

// Subscribe with typed handler
client.subscribe<UserData>('user.updated', (msg: PanMessage<UserData>) => {
  console.log(`User ${msg.data.name} updated`);
  // TypeScript knows msg.data has id, name, email
});
```

### Request/Reply Pattern

```typescript
import { PanClient } from '@larcjs/core/pan-client.mjs';
import type { PanMessage, RequestOptions } from '@larcjs/core-types';

interface GetUserRequest {
  id: number;
}

interface GetUserResponse {
  id: number;
  name: string;
  email: string;
}

const client = new PanClient();

async function getUser(id: number): Promise<GetUserResponse> {
  const response = await client.request<GetUserRequest, GetUserResponse>(
    'users.get',
    { id },
    { timeoutMs: 5000 }
  );

  return response.data;
}

// Usage
const user = await getUser(123);
console.log(user.name); // TypeScript knows user has name, email, id
```

### Auto-Cleanup with AbortController

```typescript
import { PanClient } from '@larcjs/core/pan-client.mjs';
import type { SubscribeOptions } from '@larcjs/core-types';

const client = new PanClient();
const controller = new AbortController();

const opts: SubscribeOptions = {
  retained: true,
  signal: controller.signal
};

client.subscribe('events.*', (msg) => {
  console.log('Event:', msg);
}, opts);

// Later: automatically unsubscribes
controller.abort();
```

## Type-Only Imports

Use `import type` to import types without importing runtime code:

```typescript
// This adds NO runtime code
import type {
  PanMessage,
  PanClient,
  SubscribeOptions
} from '@larcjs/core-types';

// This is the actual runtime import
import { PanClient as PanClientImpl } from '@larcjs/core/pan-client.mjs';

const client: PanClient = new PanClientImpl();
```

## VS Code IntelliSense

Even if you're writing plain JavaScript, you'll get autocomplete and type hints in VS Code when `@larcjs/core-types` is installed:

```javascript
// JavaScript file
import { PanClient } from '@larcjs/core/pan-client.mjs';

const client = new PanClient();
client.pub // VS Code suggests "publish"
client.publish({ // VS Code shows parameter hints
  topic: '',
  data: {}
});
```

## License

MIT

## Links

- [LARC Core](https://github.com/larcjs/core)
- [LARC Documentation](https://larcjs.com)
- [Report Issues](https://github.com/larcjs/core-types/issues)
