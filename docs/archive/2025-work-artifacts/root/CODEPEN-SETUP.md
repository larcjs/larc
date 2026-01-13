# CodePen Setup for LARC Demo

## Quick Setup Instructions

1. Go to [CodePen.io](https://codepen.io/pen/) and create a new pen
2. Copy the sections below into the corresponding tabs

---

## HTML

```html
<header>
  <h1>⚡ LARC Demo</h1>
  <p class="tagline">Lightweight Asynchronous Relay Core - Zero-dependency messaging</p>
</header>

<main>
  <div class="panel">
    <h2>🎮 Interactive Counter</h2>
    <div class="demo-section">
      <div class="counter-display" id="counterDisplay">0</div>

      <div class="controls">
        <button class="btn-increment" onclick="changeCounter(1)">
          ➕ Increment
        </button>
        <button class="btn-decrement" onclick="changeCounter(-1)">
          ➖ Decrement
        </button>
        <button class="btn-reset" onclick="resetCounter()">
          🔄 Reset
        </button>
      </div>

      <div class="info">
        <strong>How it works:</strong> Clicking buttons publishes messages to the PAN bus.
        The counter subscribes to these messages and updates. All communication is decoupled!
      </div>
    </div>
  </div>

  <div class="panel">
    <h2>📊 PAN Message Inspector</h2>
    <div class="message-log" id="messageLog">
      <div style="color: #6b7280; text-align: center; padding: 2rem;">
        Waiting for messages...
      </div>
    </div>
    <div class="info" style="margin-top: 1rem;">
      Watch messages flow in real-time. This is the PAN messaging bus in action!
    </div>
  </div>
</main>

<footer>
  <p>
    Learn more at <a href="https://github.com/larcjs/larc" target="_blank">github.com/larcjs/larc</a>
  </p>
</footer>
```

---

## CSS

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1.5rem;
  padding: 1.5rem;
}

header {
  text-align: center;
  color: white;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.tagline {
  font-size: 1.1rem;
  opacity: 0.95;
  font-weight: 300;
}

main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.panel {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.panel h2 {
  color: #667eea;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.demo-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

.counter-display {
  font-size: 4rem;
  font-weight: 700;
  color: #667eea;
  text-align: center;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}

button:active {
  transform: translateY(0);
}

.btn-increment {
  background: #10b981;
  color: white;
}

.btn-decrement {
  background: #ef4444;
  color: white;
}

.btn-reset {
  background: #6b7280;
  color: white;
}

.info {
  background: #f0f9ff;
  border-left: 4px solid #0ea5e9;
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #0c4a6e;
}

.message-log {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.85rem;
}

.log-entry {
  padding: 0.5rem;
  margin: 0.25rem 0;
  border-radius: 4px;
  border-left: 3px solid #667eea;
  background: white;
}

.log-time {
  color: #6b7280;
  font-size: 0.75rem;
}

.log-topic {
  color: #667eea;
  font-weight: 600;
}

.log-data {
  color: #374151;
  margin-top: 0.25rem;
}

footer {
  text-align: center;
  color: white;
  opacity: 0.9;
}

footer a {
  color: white;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 2px solid rgba(255,255,255,0.3);
  transition: border-color 0.2s;
}

footer a:hover {
  border-bottom-color: white;
}

@media (max-width: 768px) {
  main {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 2rem;
  }

  .counter-display {
    font-size: 3rem;
  }
}
```

---

## JS

**IMPORTANT:** In CodePen settings (⚙️ icon in the JS panel), add this external script:

```
https://unpkg.com/@larcjs/core@1.1.2/src/index.js
```

Then use this JavaScript code:

```js
// Import from the external module
import { PanClient, ensureBus } from 'https://unpkg.com/@larcjs/core@1.1.2/src/index.js';

// Ensure the bus exists
ensureBus();

// Create a client
const client = new PanClient();

// Counter state
let count = 0;
const display = document.getElementById('counterDisplay');
const messageLog = document.getElementById('messageLog');

// Clear initial message
messageLog.innerHTML = '';

// Helper to log messages
function logMessage(topic, data) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `
    <div class="log-time">${time}</div>
    <div class="log-topic">📨 ${topic}</div>
    <div class="log-data">${JSON.stringify(data, null, 2)}</div>
  `;

  messageLog.insertBefore(entry, messageLog.firstChild);

  // Keep only last 10 messages
  while (messageLog.children.length > 10) {
    messageLog.removeChild(messageLog.lastChild);
  }
}

// Wait for bus to be ready
client.ready().then(() => {
  logMessage('pan:sys.ready', { message: 'PAN Bus initialized!' });

  // Subscribe to counter messages
  client.subscribe('counter.change', (msg) => {
    count += msg.data.delta;
    display.textContent = count;
    logMessage('counter.change', msg.data);
  });

  client.subscribe('counter.reset', (msg) => {
    count = 0;
    display.textContent = count;
    logMessage('counter.reset', msg.data);
  });
});

// Make functions available globally
window.changeCounter = (delta) => {
  client.publish({
    topic: 'counter.change',
    data: { delta, timestamp: Date.now() }
  });
};

window.resetCounter = () => {
  client.publish({
    topic: 'counter.reset',
    data: { timestamp: Date.now() }
  });
};
```

---

## CodePen Settings

1. Click the "Settings" button (⚙️) in the JS panel
2. Set **JavaScript Preprocessor** to "None" (or leave as default)
3. The import will work as ES6 module

---

## What This Demo Shows

1. **Zero-dependency messaging** - Pure pub/sub with no frameworks
2. **Decoupled architecture** - Counter doesn't know about buttons
3. **Real-time monitoring** - Watch all messages in the inspector
4. **Simple API** - Subscribe, publish, done!

---

## Alternative: Using unpkg directly

If you have issues with CodePen's module system, you can also just paste the entire `demo-codepen.html` file contents into a single HTML file and it will work standalone!
