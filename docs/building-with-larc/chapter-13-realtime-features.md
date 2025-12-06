# Chapter 13: Real-time Features

*In which we discover that the web doesn't have to reload every time something changes, explore the art of pushing data instead of polling, and learn that "real-time" doesn't mean "instantly"—it means "fast enough that users stop complaining."*

Real-time features have gone from "nice to have" to "why doesn't this update automatically?" The modern web expects live updates, collaborative editing, instant notifications, and data that refreshes faster than a TikTok feed. In this chapter, we'll build real-time features in LARC that are performant, reliable, and won't melt your servers or your users' browsers.

## Understanding Real-time Communication

Before HTTP came along and ruined everything with its request-response pattern, computers communicated just fine by sending messages whenever they wanted. HTTP made us polite—the client asks nicely, and the server responds. But sometimes we want servers to speak when they have something to say, not just when asked.

We have three main tools for real-time communication on the web:

1. **WebSockets**: Full-duplex communication channels—both sides can talk whenever they want
2. **Server-Sent Events (SSE)**: One-way communication from server to client, simpler than WebSockets
3. **Polling**: The brute-force approach—asking "got anything new?" every few seconds

Additionally, we'll cover:

4. **BroadcastChannel**: Communication between tabs/windows in the same browser
5. **Web Workers**: Background processing for real-time data without blocking the UI

Let's build with all of these tools, starting with WebSockets.

## WebSocket Integration: The Two-Way Street

WebSockets are like a phone call, while HTTP is like passing notes. Once the connection is established, both parties can send messages whenever they want without the overhead of setting up a new connection each time.

### Building a WebSocket Client

Let's create a robust WebSocket client that handles connection lifecycle, reconnection, authentication, and message routing:

```typescript
// services/websocket-client.ts
import { authService } from './auth';

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

type MessageHandler = (payload: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: number | null = null;
  private heartbeatIntervalId: number | null = null;
  private messageHandlers = new Map<string, Set<MessageHandler>>();
  private isConnecting = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config
    };
  }

  // Connect to WebSocket server
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('Connection in progress');
      return;
    }

    this.isConnecting = true;

    try {
      // Get auth token
      const token = authService.getAccessToken();
      const url = token
        ? `${this.config.url}?token=${token}`
        : this.config.url;

      this.ws = new WebSocket(url);

      // Setup event handlers
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onclose = (event) => this.handleClose(event);

      // Wait for connection
      await this.waitForConnection();
    } finally {
      this.isConnecting = false;
    }
  }

  // Wait for connection to open
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.ws.addEventListener('open', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });

      this.ws.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('Connection failed'));
      }, { once: true });
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    this.stopHeartbeat();
    this.stopReconnect();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  // Send message to server
  send(type: string, payload: any): void {
    if (!this.isConnected()) {
      console.error('Cannot send message: not connected');
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now()
    };

    this.ws!.send(JSON.stringify(message));
  }

  // Subscribe to messages of specific type
  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  // Check if connected
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Handle connection open
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();

    // Notify listeners
    this.notifyHandlers('connected', {});
  }

  // Handle incoming message
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;

      // Handle heartbeat response
      if (message.type === 'pong') {
        return;
      }

      // Notify type-specific handlers
      this.notifyHandlers(message.type, message.payload);

      // Notify global handlers
      this.notifyHandlers('*', message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  // Handle connection error
  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.notifyHandlers('error', { error });
  }

  // Handle connection close
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    this.stopHeartbeat();

    // Notify listeners
    this.notifyHandlers('disconnected', {
      code: event.code,
      reason: event.reason
    });

    // Attempt reconnection if not a normal close
    if (event.code !== 1000 && event.code !== 1001) {
      this.attemptReconnect();
    }
  }

  // Notify all handlers for a message type
  private notifyHandlers(type: string, payload: any): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Handler error for type ${type}:`, error);
        }
      });
    }
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatIntervalId = window.setInterval(() => {
      if (this.isConnected()) {
        this.send('ping', {});
      }
    }, this.config.heartbeatInterval);
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId !== null) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  // Attempt to reconnect
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifyHandlers('reconnect-failed', {});
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * this.reconnectAttempts,
      30000
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeoutId = window.setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  // Stop reconnection attempts
  private stopReconnect(): void {
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.reconnectAttempts = 0;
  }
}

// Create and export singleton instance
export const wsClient = new WebSocketClient({
  url: process.env.WS_URL || 'ws://localhost:3000/ws'
});
```

### Using WebSockets in Components

Now let's create a component that uses our WebSocket client to display real-time notifications:

```typescript
// components/notification-feed.ts
import { html, define, Component } from '@larc/lib';
import { wsClient } from '../services/websocket-client';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
}

interface NotificationFeedState {
  notifications: Notification[];
  isConnected: boolean;
}

class NotificationFeed extends Component {
  static tagName = 'notification-feed';

  state: NotificationFeedState = {
    notifications: [],
    isConnected: false
  };

  private unsubscribers: Array<() => void> = [];

  async connectedCallback() {
    super.connectedCallback();

    // Connect to WebSocket
    await wsClient.connect();

    // Subscribe to notification messages
    this.unsubscribers.push(
      wsClient.on('notification', (notification: Notification) => {
        this.addNotification(notification);
      })
    );

    // Subscribe to connection status
    this.unsubscribers.push(
      wsClient.on('connected', () => {
        this.setState({ isConnected: true });
      })
    );

    this.unsubscribers.push(
      wsClient.on('disconnected', () => {
        this.setState({ isConnected: false });
      })
    );

    // Update initial connection state
    this.setState({ isConnected: wsClient.isConnected() });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Unsubscribe from all messages
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }

  private addNotification(notification: Notification): void {
    this.setState({
      notifications: [notification, ...this.state.notifications].slice(0, 50)
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.dismissNotification(notification.id);
    }, 5000);
  }

  private dismissNotification(id: string): void {
    this.setState({
      notifications: this.state.notifications.filter(n => n.id !== id)
    });
  }

  render() {
    const { notifications, isConnected } = this.state;

    return html`
      <div class="notification-feed">
        <div class="connection-status ${isConnected ? 'connected' : 'disconnected'}">
          ${isConnected ? '● Connected' : '○ Disconnected'}
        </div>

        <div class="notifications">
          ${notifications.map(notification => html`
            <div class="notification ${notification.type}" key="${notification.id}">
              <div class="notification-header">
                <strong>${notification.title}</strong>
                <button
                  class="dismiss"
                  onclick="${() => this.dismissNotification(notification.id)}"
                >
                  ×
                </button>
              </div>
              <div class="notification-body">
                ${notification.message}
              </div>
              <div class="notification-time">
                ${this.formatTime(notification.timestamp)}
              </div>
            </div>
          `)}
        </div>
      </div>

      <style>
        .notification-feed {
          position: fixed;
          top: 1rem;
          right: 1rem;
          width: 320px;
          max-height: 80vh;
          overflow-y: auto;
          z-index: 1000;
        }

        .connection-status {
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          text-align: center;
        }

        .connection-status.connected {
          background: #d4edda;
          color: #155724;
        }

        .connection-status.disconnected {
          background: #f8d7da;
          color: #721c24;
        }

        .notification {
          background: white;
          border-left: 4px solid;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 0.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out;
        }

        .notification.info { border-color: #17a2b8; }
        .notification.success { border-color: #28a745; }
        .notification.warning { border-color: #ffc107; }
        .notification.error { border-color: #dc3545; }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .dismiss {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #999;
        }

        .notification-time {
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.5rem;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    `;
  }

  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }
}

define(NotificationFeed);
```

## Server-Sent Events: One-Way Data Flow

Server-Sent Events (SSE) are perfect when you only need the server to push updates to the client. They're simpler than WebSockets, work over regular HTTP, and automatically reconnect when disconnected. Think of them as a fire hose of data from server to client.

### Building an SSE Client

```typescript
// services/sse-client.ts
interface SSEConfig {
  url: string;
  withCredentials?: boolean;
  reconnectDelay?: number;
}

type SSEEventHandler = (data: any) => void;

class SSEClient {
  private eventSource: EventSource | null = null;
  private config: Required<SSEConfig>;
  private eventHandlers = new Map<string, Set<SSEEventHandler>>();
  private isConnecting = false;

  constructor(config: SSEConfig) {
    this.config = {
      withCredentials: true,
      reconnectDelay: 3000,
      ...config
    };
  }

  // Connect to SSE endpoint
  connect(): void {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log('Already connected to SSE');
      return;
    }

    if (this.isConnecting) {
      console.log('SSE connection in progress');
      return;
    }

    this.isConnecting = true;

    try {
      this.eventSource = new EventSource(this.config.url, {
        withCredentials: this.config.withCredentials
      });

      this.eventSource.onopen = () => this.handleOpen();
      this.eventSource.onerror = (error) => this.handleError(error);

      // Listen for default message event
      this.eventSource.onmessage = (event) => {
        this.handleEvent('message', event.data);
      };
    } finally {
      this.isConnecting = false;
    }
  }

  // Disconnect from SSE endpoint
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Subscribe to named events
  on(eventName: string, handler: SSEEventHandler): () => void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());

      // Register event listener with EventSource
      if (this.eventSource && eventName !== 'message') {
        this.eventSource.addEventListener(eventName, (event: MessageEvent) => {
          this.handleEvent(eventName, event.data);
        });
      }
    }

    this.eventHandlers.get(eventName)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  // Check if connected
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  // Handle connection open
  private handleOpen(): void {
    console.log('SSE connected');
    this.notifyHandlers('connected', {});
  }

  // Handle error
  private handleError(error: Event): void {
    console.error('SSE error:', error);

    if (this.eventSource?.readyState === EventSource.CLOSED) {
      console.log('SSE connection closed, reconnecting...');
      this.notifyHandlers('disconnected', {});

      // Reconnect after delay
      setTimeout(() => {
        this.connect();
      }, this.config.reconnectDelay);
    }
  }

  // Handle incoming event
  private handleEvent(eventName: string, data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.notifyHandlers(eventName, parsed);
    } catch {
      // If not JSON, pass raw data
      this.notifyHandlers(eventName, data);
    }
  }

  // Notify all handlers for an event
  private notifyHandlers(eventName: string, data: any): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Handler error for event ${eventName}:`, error);
        }
      });
    }
  }
}

export const sseClient = new SSEClient({
  url: '/api/events'
});
```

### Live Activity Feed with SSE

Let's build a live activity feed that displays real-time updates using SSE:

```typescript
// components/activity-feed.ts
import { html, define, Component } from '@larc/lib';
import { sseClient } from '../services/sse-client';

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: number;
}

interface ActivityFeedState {
  activities: Activity[];
  isConnected: boolean;
}

class ActivityFeed extends Component {
  static tagName = 'activity-feed';

  state: ActivityFeedState = {
    activities: [],
    isConnected: false
  };

  private unsubscribers: Array<() => void> = [];

  connectedCallback() {
    super.connectedCallback();

    // Connect to SSE
    sseClient.connect();

    // Subscribe to activity events
    this.unsubscribers.push(
      sseClient.on('activity', (activity: Activity) => {
        this.addActivity(activity);
      })
    );

    // Subscribe to connection events
    this.unsubscribers.push(
      sseClient.on('connected', () => {
        this.setState({ isConnected: true });
      })
    );

    this.unsubscribers.push(
      sseClient.on('disconnected', () => {
        this.setState({ isConnected: false });
      })
    );

    // Load initial activities
    this.loadActivities();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribers.forEach(unsub => unsub());
  }

  private async loadActivities(): Promise<void> {
    try {
      const response = await fetch('/api/activities?limit=20');
      const activities = await response.json();
      this.setState({ activities });
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }

  private addActivity(activity: Activity): void {
    // Add to beginning and limit to 100 items
    this.setState({
      activities: [activity, ...this.state.activities].slice(0, 100)
    });
  }

  render() {
    const { activities, isConnected } = this.state;

    return html`
      <div class="activity-feed">
        <div class="feed-header">
          <h3>Activity Feed</h3>
          <span class="status ${isConnected ? 'live' : 'offline'}">
            ${isConnected ? '● Live' : '○ Offline'}
          </span>
        </div>

        <div class="activities">
          ${activities.length === 0 ? html`
            <div class="empty">No recent activity</div>
          ` : activities.map(activity => html`
            <div class="activity-item" key="${activity.id}">
              <div class="activity-avatar">
                ${activity.userName.charAt(0).toUpperCase()}
              </div>
              <div class="activity-content">
                <div class="activity-text">
                  <strong>${activity.userName}</strong>
                  ${activity.action}
                  <em>${activity.target}</em>
                </div>
                <div class="activity-time">
                  ${this.formatTime(activity.timestamp)}
                </div>
              </div>
            </div>
          `)}
        </div>
      </div>

      <style>
        .activity-feed {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .feed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #ddd;
          background: #f8f9fa;
        }

        .feed-header h3 {
          margin: 0;
        }

        .status {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status.live { color: #28a745; }
        .status.offline { color: #6c757d; }

        .activities {
          max-height: 500px;
          overflow-y: auto;
        }

        .activity-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #eee;
          animation: fadeIn 0.3s ease-out;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #007bff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
        }

        .activity-text {
          margin-bottom: 0.25rem;
        }

        .activity-time {
          font-size: 0.75rem;
          color: #6c757d;
        }

        .empty {
          padding: 2rem;
          text-align: center;
          color: #6c757d;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    `;
  }

  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  }
}

define(ActivityFeed);
```

## BroadcastChannel: Cross-Tab Communication

BroadcastChannel lets different tabs and windows of your application communicate with each other. It's perfect for keeping UI state synchronized across multiple tabs—like ensuring all tabs show "logged out" when a user logs out in one tab.

### Building a Tab Synchronization Service

```typescript
// services/tab-sync.ts
interface SyncMessage {
  type: string;
  payload: any;
  timestamp: number;
  tabId: string;
}

type SyncHandler = (payload: any, tabId: string) => void;

class TabSyncService {
  private channel: BroadcastChannel;
  private tabId: string;
  private handlers = new Map<string, Set<SyncHandler>>();

  constructor(channelName: string = 'app-sync') {
    this.channel = new BroadcastChannel(channelName);
    this.tabId = this.generateTabId();

    // Listen for messages
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    // Announce this tab
    this.broadcast('tab-connected', { tabId: this.tabId });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.broadcast('tab-disconnected', { tabId: this.tabId });
      this.channel.close();
    });
  }

  // Broadcast message to all tabs
  broadcast(type: string, payload: any): void {
    const message: SyncMessage = {
      type,
      payload,
      timestamp: Date.now(),
      tabId: this.tabId
    };

    this.channel.postMessage(message);
  }

  // Subscribe to message type
  on(type: string, handler: SyncHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)!.add(handler);

    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  // Handle incoming message
  private handleMessage(message: SyncMessage): void {
    // Ignore messages from this tab
    if (message.tabId === this.tabId) {
      return;
    }

    this.notifyHandlers(message.type, message.payload, message.tabId);
  }

  // Notify handlers
  private notifyHandlers(type: string, payload: any, tabId: string): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload, tabId);
        } catch (error) {
          console.error(`Handler error for type ${type}:`, error);
        }
      });
    }
  }

  // Generate unique tab ID
  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get this tab's ID
  getTabId(): string {
    return this.tabId;
  }
}

export const tabSync = new TabSyncService();
```

### Synchronizing Authentication Across Tabs

Let's use BroadcastChannel to keep authentication state synchronized:

```typescript
// services/auth-sync.ts
import { tabSync } from './tab-sync';
import { authService } from './auth';

class AuthSyncService {
  constructor() {
    // Listen for logout in other tabs
    tabSync.on('auth-logout', () => {
      console.log('Logout detected in another tab');
      authService.logout();
      window.location.href = '/login?reason=logout-other-tab';
    });

    // Listen for login in other tabs
    tabSync.on('auth-login', (user) => {
      console.log('Login detected in another tab');
      // Reload to pick up new auth state
      window.location.reload();
    });

    // Listen for token refresh in other tabs
    tabSync.on('auth-token-refresh', () => {
      console.log('Token refresh detected in another tab');
      // Re-initialize auth from storage
      authService.initialize();
    });
  }

  // Broadcast logout to other tabs
  broadcastLogout(): void {
    tabSync.broadcast('auth-logout', {});
  }

  // Broadcast login to other tabs
  broadcastLogin(user: any): void {
    tabSync.broadcast('auth-login', user);
  }

  // Broadcast token refresh to other tabs
  broadcastTokenRefresh(): void {
    tabSync.broadcast('auth-token-refresh', {});
  }
}

export const authSync = new AuthSyncService();
```

## Web Workers: Background Processing

Web Workers let you run JavaScript in background threads, keeping your UI responsive while processing data, crunching numbers, or handling real-time updates. They're like hiring an intern who works in another room and sends you updates via email.

### Creating a Data Processing Worker

```typescript
// workers/data-processor.worker.ts
interface ProcessRequest {
  id: string;
  type: 'sort' | 'filter' | 'aggregate';
  data: any[];
  options: any;
}

interface ProcessResponse {
  id: string;
  result: any;
  error?: string;
}

// Worker message handler
self.onmessage = (event: MessageEvent<ProcessRequest>) => {
  const { id, type, data, options } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'sort':
        result = sortData(data, options);
        break;
      case 'filter':
        result = filterData(data, options);
        break;
      case 'aggregate':
        result = aggregateData(data, options);
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }

    const response: ProcessResponse = { id, result };
    self.postMessage(response);
  } catch (error) {
    const response: ProcessResponse = {
      id,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    self.postMessage(response);
  }
};

function sortData(data: any[], options: any): any[] {
  const { field, order = 'asc' } = options;
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return order === 'asc' ? comparison : -comparison;
  });
}

function filterData(data: any[], options: any): any[] {
  const { field, value, operator = 'equals' } = options;

  return data.filter(item => {
    const itemValue = item[field];

    switch (operator) {
      case 'equals':
        return itemValue === value;
      case 'contains':
        return String(itemValue).includes(String(value));
      case 'greater':
        return itemValue > value;
      case 'less':
        return itemValue < value;
      default:
        return true;
    }
  });
}

function aggregateData(data: any[], options: any): any {
  const { operation, field } = options;

  switch (operation) {
    case 'count':
      return data.length;
    case 'sum':
      return data.reduce((sum, item) => sum + (item[field] || 0), 0);
    case 'average':
      const sum = data.reduce((s, item) => s + (item[field] || 0), 0);
      return data.length > 0 ? sum / data.length : 0;
    case 'min':
      return Math.min(...data.map(item => item[field]));
    case 'max':
      return Math.max(...data.map(item => item[field]));
    default:
      return null;
  }
}
```

### Worker Manager

```typescript
// services/worker-manager.ts
class WorkerManager {
  private worker: Worker | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string, {
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }>();

  constructor(workerUrl: string) {
    this.worker = new Worker(workerUrl);

    this.worker.onmessage = (event) => {
      const { id, result, error } = event.data;
      const pending = this.pendingRequests.get(id);

      if (pending) {
        this.pendingRequests.delete(id);

        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(result);
        }
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
    };
  }

  // Send request to worker
  async process(type: string, data: any[], options: any): Promise<any> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const id = `req-${++this.requestId}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.worker!.postMessage({
        id,
        type,
        data,
        options
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  // Terminate worker
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('Worker terminated'));
    });
    this.pendingRequests.clear();
  }
}

export const dataWorker = new WorkerManager(
  new URL('../workers/data-processor.worker.ts', import.meta.url).href
);
```

## Real-time Collaboration Patterns

Let's build a collaborative document editor that demonstrates real-time collaboration:

```typescript
// components/collaborative-editor.ts
import { html, define, Component } from '@larc/lib';
import { wsClient } from '../services/websocket-client';

interface EditorState {
  content: string;
  collaborators: Map<string, { name: string; cursor: number }>;
  docId: string;
}

class CollaborativeEditor extends Component {
  static tagName = 'collaborative-editor';

  state: EditorState = {
    content: '',
    collaborators: new Map(),
    docId: this.props.documentId || 'default'
  };

  private editorRef: HTMLTextAreaElement | null = null;
  private unsubscribers: Array<() => void> = [];
  private localChanges = false;

  async connectedCallback() {
    super.connectedCallback();

    await wsClient.connect();

    // Join document collaboration
    wsClient.send('join-document', { docId: this.state.docId });

    // Subscribe to document updates
    this.unsubscribers.push(
      wsClient.on('document-update', (update: any) => {
        if (!this.localChanges) {
          this.applyRemoteUpdate(update);
        }
      })
    );

    // Subscribe to collaborator updates
    this.unsubscribers.push(
      wsClient.on('collaborator-joined', (collaborator: any) => {
        const collaborators = new Map(this.state.collaborators);
        collaborators.set(collaborator.userId, collaborator);
        this.setState({ collaborators });
      })
    );

    this.unsubscribers.push(
      wsClient.on('collaborator-left', (data: any) => {
        const collaborators = new Map(this.state.collaborators);
        collaborators.delete(data.userId);
        this.setState({ collaborators });
      })
    );

    // Load initial document content
    await this.loadDocument();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Leave document
    wsClient.send('leave-document', { docId: this.state.docId });

    this.unsubscribers.forEach(unsub => unsub());
  }

  private async loadDocument(): Promise<void> {
    try {
      const response = await fetch(`/api/documents/${this.state.docId}`);
      const data = await response.json();
      this.setState({ content: data.content });
    } catch (error) {
      console.error('Failed to load document:', error);
    }
  }

  private handleInput(e: Event): void {
    const textarea = e.target as HTMLTextAreaElement;
    const newContent = textarea.value;
    const cursorPosition = textarea.selectionStart;

    this.localChanges = true;
    this.setState({ content: newContent });

    // Send update to server
    wsClient.send('document-update', {
      docId: this.state.docId,
      content: newContent,
      cursor: cursorPosition
    });

    // Reset local changes flag after a delay
    setTimeout(() => {
      this.localChanges = false;
    }, 100);
  }

  private applyRemoteUpdate(update: any): void {
    this.setState({ content: update.content });
  }

  render() {
    const { content, collaborators } = this.state;

    return html`
      <div class="collaborative-editor">
        <div class="editor-header">
          <div class="collaborators">
            ${Array.from(collaborators.values()).map(collab => html`
              <div class="collaborator-badge" title="${collab.name}">
                ${collab.name.charAt(0).toUpperCase()}
              </div>
            `)}
          </div>
        </div>

        <textarea
          class="editor-content"
          value="${content}"
          oninput="${this.handleInput}"
          placeholder="Start typing..."
          ref="${(el: HTMLTextAreaElement) => this.editorRef = el}"
        ></textarea>
      </div>

      <style>
        .collaborative-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .editor-header {
          padding: 1rem;
          background: #f8f9fa;
          border-bottom: 1px solid #ddd;
        }

        .collaborators {
          display: flex;
          gap: 0.5rem;
        }

        .collaborator-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #007bff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .editor-content {
          flex: 1;
          padding: 1rem;
          border: none;
          resize: none;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
        }

        .editor-content:focus {
          outline: none;
        }
      </style>
    `;
  }
}

define(CollaborativeEditor);
```

## What We've Learned

In this chapter, we've built comprehensive real-time features for LARC applications:

- **WebSocket integration** with automatic reconnection, heartbeat, and message routing
- **Server-Sent Events** for one-way server-to-client updates
- **BroadcastChannel** for synchronizing state across browser tabs
- **Web Workers** for background processing without blocking the UI
- **Real-time collaboration** patterns for building multi-user experiences

Real-time features transform applications from static pages into living, breathing experiences. Users no longer need to refresh to see updates—the updates come to them. Just remember: with great real-time power comes great responsibility to handle connection failures, race conditions, and the inevitable "why isn't it updating?" support tickets.

In the next chapter, we'll explore file management, where we'll learn to work with the Origin Private File System (OPFS), build file browsers, and handle uploads and downloads—because what's a modern application without the ability to handle files?
