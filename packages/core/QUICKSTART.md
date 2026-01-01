# LARC Quickstart - Zero Config Setup

## The Simplest Possible Setup

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@larcjs/core@2.0.0/pan.mjs"></script>
</head>
<body>
  <pan-card>
    <h1>That's it!</h1>
    <p>One line. Zero config. All components auto-load.</p>
  </pan-card>
</body>
</html>
```

## What You Get

- **PAN Messaging Bus** - Publish/subscribe communication between components
- **Auto-loading Components** - 60+ UI components load on-demand as they appear
- **Zero Build** - No npm, no webpack, no bundlers needed
- **Zero Config** - Works out of the box, components auto-discovered

## Available Components

All components auto-load from `@larcjs/core/components/`:

- `<pan-card>` - Card container
- `<pan-data-table>` - Data grid with sorting/filtering
- `<pan-form>` - Auto-generating forms
- `<pan-data-connector>` - REST API connector
- `<pan-router>` - Client-side routing
- `<pan-auth>` - Authentication helper
- ...and 50+ more!

## Using the Messaging Bus

```html
<script type="module">
  import { PanClient } from 'https://cdn.jsdelivr.net/npm/@larcjs/core@2.0.0/pan-client.mjs';

  const client = new PanClient();

  // Publish
  client.publish('user.login', { username: 'john' });

  // Subscribe
  client.subscribe('user.login', (msg) => {
    console.log('User logged in:', msg.data);
  });
</script>
```

## Local Development

```html
<!-- Use local files -->
<script type="module" src="./pan.mjs"></script>
```

Components will auto-load from `./components/` directory.

## That's All!

Seriously. One script tag. That's the entire setup.
