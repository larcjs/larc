# LARC Project Plan

## Philosophy

**Development:** Zero-build required - fast iteration with native ES modules
**Production:** Build recommended - optimized delivery (bundling, minification, tree-shaking)
**TypeScript:** Opt-in via separate type packages
**Framework Integration:** Works alongside React, Vue, Angular, Svelte via adapters

## 1. Type-Only Packages (Chosen Strategy)

### Package Structure

```
@larcjs/core              # Pure JavaScript, zero dependencies
@larcjs/core-types        # TypeScript definitions only

@larcjs/ui        # Pure JavaScript
@larcjs/ui-types  # TypeScript definitions only

@larcjs/devtools          # Pure JavaScript
@larcjs/devtools-types    # TypeScript definitions only
```

### Benefits
- Zero-build users never see types
- TypeScript users opt-in
- Types can evolve independently
- Keeps core packages lean

### Implementation: @larcjs/core-types

**Directory Structure:**
```
core-types/
├── package.json
├── README.md
├── index.d.ts
├── components/
│   ├── pan-bus.d.ts
│   ├── pan-client.d.ts
│   └── pan-autoload.d.ts
└── types/
    ├── message.d.ts
    ├── subscription.d.ts
    └── config.d.ts
```

**package.json:**
```json
{
  "name": "@larcjs/core-types",
  "version": "1.0.0",
  "description": "TypeScript definitions for @larcjs/core",
  "types": "index.d.ts",
  "type": "module",
  "files": ["**/*.d.ts"],
  "peerDependencies": {
    "@larcjs/core": "^1.0.0"
  },
  "keywords": ["typescript", "types", "larc", "pan"],
  "license": "MIT"
}
```

**Key Type Definitions:**

**types/message.d.ts:**
```typescript
export interface PanMessage<T = any> {
  topic: string;
  data: T;
  timestamp: number;
  id: string;
  meta?: Record<string, any>;
}

export interface PublishOptions {
  buffer?: boolean;
  ttl?: number;
  meta?: Record<string, any>;
}
```

**components/pan-client.d.ts:**
```typescript
import type { PanMessage, PublishOptions } from '../types/message.js';

export type SubscriptionCallback<T = any> = (message: PanMessage<T>) => void;
export type UnsubscribeFunction = () => void;

export interface PanClientOptions {
  document?: Document;
  busTag?: string;
  debug?: boolean;
}

export class PanClient {
  constructor(document?: Document, busTag?: string);
  constructor(options?: PanClientOptions);

  publish<T = any>(topic: string, data: T, options?: PublishOptions): void;
  subscribe<T = any>(topic: string, callback: SubscriptionCallback<T>): UnsubscribeFunction;
  unsubscribe(topic: string, callback: SubscriptionCallback): void;
  once<T = any>(topic: string, callback: SubscriptionCallback<T>): UnsubscribeFunction;
  hasSubscribers(topic: string): boolean;
  getTopics(): string[];
}
```

### Usage

**TypeScript users:**
```bash
npm install @larcjs/core
npm install -D @larcjs/core-types
```

```typescript
import { PanClient } from '@larcjs/core/pan-client.mjs';
import type { PanMessage, PublishOptions } from '@larcjs/core-types';

const client = new PanClient();
client.subscribe<{ userId: number }>('user.updated', (msg: PanMessage) => {
  console.log(msg.data.userId);
});
```

**JavaScript users:**
```bash
npm install @larcjs/core
```

```javascript
import { PanClient } from '@larcjs/core/pan-client.mjs';
const client = new PanClient();
```

## 2. Framework Adapters

LARC works as an infrastructure layer alongside existing frameworks.

### React Adapter (@larcjs/react-adapter)

```typescript
// usePanClient.ts
import { useEffect, useRef } from 'react';
import { PanClient } from '@larcjs/core/pan-client.mjs';
import type { PanMessage } from '@larcjs/core-types';

export function usePanClient() {
  const clientRef = useRef<PanClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new PanClient();
  }
  return clientRef.current;
}

export function usePanSubscribe<T = any>(
  topic: string,
  callback: (message: PanMessage<T>) => void
) {
  const client = usePanClient();
  useEffect(() => {
    const unsubscribe = client.subscribe(topic, callback);
    return unsubscribe;
  }, [topic, callback, client]);
}

export function usePanPublish() {
  const client = usePanClient();
  return (topic: string, data: any) => client.publish(topic, data);
}
```

### Vue Adapter (@larcjs/vue-adapter)

```typescript
// composables.ts
import { onMounted, onUnmounted } from 'vue';
import { PanClient } from '@larcjs/core/pan-client.mjs';
import type { PanMessage } from '@larcjs/core-types';

let client: PanClient | null = null;

export function usePanClient() {
  if (!client) client = new PanClient();
  return client;
}

export function usePanSubscribe<T = any>(
  topic: string,
  callback: (message: PanMessage<T>) => void
) {
  const client = usePanClient();
  onMounted(() => client.subscribe(topic, callback));
  onUnmounted(() => client.unsubscribe(topic, callback));
}

export function usePanPublish() {
  const client = usePanClient();
  return (topic: string, data: any) => client.publish(topic, data);
}
```

### Angular Adapter (@larcjs/angular-adapter)

```typescript
// pan.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PanClient } from '@larcjs/core/pan-client.mjs';
import type { PanMessage } from '@larcjs/core-types';

@Injectable({ providedIn: 'root' })
export class PanService {
  private client = new PanClient();

  publish<T>(topic: string, data: T): void {
    this.client.publish(topic, data);
  }

  subscribe<T>(topic: string): Observable<PanMessage<T>> {
    return new Observable(subscriber => {
      const unsubscribe = this.client.subscribe(topic, (msg) => {
        subscriber.next(msg);
      });
      return unsubscribe;
    });
  }
}
```

### Svelte Adapter (@larcjs/svelte-adapter)

```typescript
// stores.ts
import { writable } from 'svelte/store';
import { PanClient } from '@larcjs/core/pan-client.mjs';
import type { PanMessage } from '@larcjs/core-types';

const client = new PanClient();

export function panStore<T>(topic: string, initialValue: T) {
  const { subscribe, set } = writable<T>(initialValue);

  client.subscribe<T>(topic, (msg) => set(msg.data));

  return {
    subscribe,
    publish: (data: T) => {
      set(data);
      client.publish(topic, data);
    }
  };
}
```

## 3. Production Build Options

### Option A: Vite (Recommended)

**vite.config.js:**
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: { input: { main: 'index.html' } },
    minify: 'terser',
    sourcemap: true,
    chunkSizeWarningLimit: 500
  },
  server: { port: 8000 }
});
```

**Usage:**
```bash
npm run dev      # Development (no build, instant start)
npm run build    # Production (bundled, minified, optimized)
```

### Option B: Rollup (Lightweight)

```javascript
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/main.js',
  output: { file: 'dist/bundle.js', format: 'es', sourcemap: true },
  plugins: [resolve(), terser()]
};
```

### Option C: esbuild (Fastest)

```javascript
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outfile: 'dist/bundle.js',
});
```

### Option D: No Build (HTTP/2 + CDN)

```html
<!-- Modern browsers + HTTP/2 = fast enough -->
<script type="module" src="https://unpkg.com/@larcjs/core/pan-client.mjs"></script>
```

## 4. Complete Package Ecosystem

```
Core Packages (JavaScript only):
├── @larcjs/core
├── @larcjs/ui
├── @larcjs/devtools

Type Packages (Opt-in):
├── @larcjs/core-types
├── @larcjs/ui-types
├── @larcjs/devtools-types

Framework Adapters:
├── @larcjs/react-adapter
├── @larcjs/vue-adapter
├── @larcjs/angular-adapter
├── @larcjs/svelte-adapter

Build Tools (Optional):
├── @larcjs/vite-plugin
├── @larcjs/rollup-plugin

Developer Tools:
├── @larcjs/cli (scaffolding)
├── @larcjs/test-utils
```

## 5. Updated Positioning

**Before:**
> "LARC: Zero-build web component framework" (sounds niche, anti-tooling)

**After:**
> **LARC: Browser-native component framework with optional builds**
>
> - Zero-build development for fast iteration
> - Works alongside React, Vue, Angular, Svelte
> - Production builds supported (Vite, Rollup, esbuild)
> - TypeScript-ready with opt-in type packages
> - Deploy unbundled or bundled - your choice

## 6. Key Value Propositions

1. **More practical:** Works with existing stacks, not a replacement
2. **More flexible:** Opt-in everything (types, builds, frameworks)
3. **More adoptable:** Doesn't require rewriting apps
4. **More credible:** Production-ready with real optimization paths

## Next Steps

1. Create @larcjs/core-types repository and publish to npm
2. Build React adapter as proof of concept
3. Write production deployment guide (docs/production.md)
4. Update main README with new positioning
