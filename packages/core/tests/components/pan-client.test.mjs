/**
 * Comprehensive tests for pan-client.mjs component
 * Tests cover: constructor, ready state, publishing, subscriptions,
 * request/reply, wildcards, and error handling
 */

import { test, expect } from '@playwright/test';
import { fileUrl } from '../lib/test-utils.mjs';

test.describe('PAN Client Component', () => {
test.describe('Constructor & Initialization', () => {
    test('should create client with default host (document)', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const clientInfo = await page.evaluate(() => {
        const client = new window.PanClient();
        return {
          hasHost: client.host === document,
          hasBus: client.bus !== null,
          hasClientId: !!client.clientId,
          clientIdFormat: client.clientId.startsWith('doc#')
        };
      });

      expect(clientInfo.hasHost).toBe(true);
      expect(clientInfo.hasBus).toBe(true);
      expect(clientInfo.hasClientId).toBe(true);
      expect(clientInfo.clientIdFormat).toBe(true);
    });

    test('should create client with custom host element', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const clientInfo = await page.evaluate(() => {
        const bus = document.getElementById('test-bus');
        const client = new window.PanClient(bus);
        return {
          hasHost: client.host === bus,
          clientIdPrefix: client.clientId.split('#')[0]
        };
      });

      expect(clientInfo.hasHost).toBe(true);
      expect(clientInfo.clientIdPrefix).toBe('pan-bus');
    });

    test('should generate unique client IDs', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const clientIds = await page.evaluate(() => {
        const client1 = new window.PanClient();
        const client2 = new window.PanClient();
        return [client1.clientId, client2.clientId];
      });

      expect(clientIds[0]).not.toBe(clientIds[1]);
      expect(clientIds[0]).toMatch(/^doc#[a-f0-9-]+$/);
      expect(clientIds[1]).toMatch(/^doc#[a-f0-9-]+$/);
    });
  });

  test.describe('Ready State Management', () => {
    test('should resolve ready() promise when bus is ready', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const readyResult = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();
        return { success: true };
      });

      expect(readyResult.success).toBe(true);
    });

    test('should flush pending operations after ready', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(async () => {
        window.receivedMessages = [];
        document.addEventListener('pan:deliver', (e) => {
          window.receivedMessages.push(e.detail);
        });

        // Create client and publish BEFORE ready
        const client = new window.PanClient();

        // Subscribe immediately
        client.subscribe('test.pending', (msg) => {
          // Handler will be called after ready
        });

        // Publish immediately (should be queued)
        client.publish({
          topic: 'test.pending',
          data: { message: 'queued' }
        });

        // Wait for ready
        await client.ready();

        // Give time for message delivery
        await new Promise(resolve => setTimeout(resolve, 100));

        return window.receivedMessages.length > 0;
      });

      expect(result).toBe(true);
    });
  });

  test.describe('Message Publishing', () => {
    test('should publish basic message', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      await page.evaluate(() => {
        window.receivedMessages = [];
        document.addEventListener('pan:deliver', (e) => {
          window.receivedMessages.push(e.detail);
        });
      });

      const result = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();

        // Subscribe first
        client.subscribe('test.basic', () => {});

        // Then publish
        client.publish({
          topic: 'test.basic',
          data: { message: 'hello' }
        });

        // Wait for delivery
        await new Promise(resolve => setTimeout(resolve, 100));

        const msg = window.receivedMessages[0];
        return {
          received: window.receivedMessages.length > 0,
          topic: msg?.topic,
          message: msg?.data?.message
        };
      });

      expect(result.received).toBe(true);
      expect(result.topic).toBe('test.basic');
      expect(result.message).toBe('hello');
    });

    test('should publish retained message', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();

        // Publish retained message first
        client.publish({
          topic: 'test.retained',
          data: { value: 42 },
          retain: true
        });

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 50));

        // Subscribe after publishing (should receive retained)
        return new Promise((resolve) => {
          client.subscribe('test.retained', (msg) => {
            resolve({
              topic: msg.topic,
              value: msg.data.value,
              retain: msg.retain
            });
          }, { retained: true });
        });
      });

      expect(result.topic).toBe('test.retained');
      expect(result.value).toBe(42);
    });
  });

  test.describe('Subscription with Wildcards', () => {
    test('should subscribe to exact topic', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();

        const messages = [];
        client.subscribe('users.updated', (msg) => {
          messages.push(msg);
        });

        // Publish matching
        client.publish({ topic: 'users.updated', data: { id: 1 } });

        // Publish non-matching
        client.publish({ topic: 'users.created', data: { id: 2 } });
        client.publish({ topic: 'posts.updated', data: { id: 3 } });

        await new Promise(resolve => setTimeout(resolve, 100));

        return {
          count: messages.length,
          topic: messages[0]?.topic
        };
      });

      expect(result.count).toBe(1);
      expect(result.topic).toBe('users.updated');
    });

    test('should subscribe to wildcard pattern', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();

        const messages = [];
        client.subscribe('users.*', (msg) => {
          messages.push(msg);
        });

        // Publish matching
        client.publish({ topic: 'users.created', data: { id: 1 } });
        client.publish({ topic: 'users.updated', data: { id: 2 } });
        client.publish({ topic: 'users.deleted', data: { id: 3 } });

        // Publish non-matching
        client.publish({ topic: 'posts.created', data: { id: 4 } });

        await new Promise(resolve => setTimeout(resolve, 100));

        return {
          count: messages.length,
          topics: messages.map(m => m.topic)
        };
      });

      expect(result.count).toBe(3);
      expect(result.topics).toEqual(['users.created', 'users.updated', 'users.deleted']);
    });

    test('should subscribe to multiple topic patterns', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();

        const messages = [];
        client.subscribe(['users.*', 'posts.*'], (msg) => {
          messages.push(msg);
        });

        // Publish matching
        client.publish({ topic: 'users.created', data: { id: 1 } });
        client.publish({ topic: 'posts.created', data: { id: 2 } });

        // Publish non-matching
        client.publish({ topic: 'comments.created', data: { id: 3 } });

        await new Promise(resolve => setTimeout(resolve, 100));

        return {
          count: messages.length,
          topics: messages.map(m => m.topic)
        };
      });

      expect(result.count).toBe(2);
      expect(result.topics).toContain('users.created');
      expect(result.topics).toContain('posts.created');
    });

    test('should unsubscribe with returned function', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();

        const messages = [];
        const unsubscribe = client.subscribe('test.unsub', (msg) => {
          messages.push(msg);
        });

        // Publish first message
        client.publish({ topic: 'test.unsub', data: { n: 1 } });
        await new Promise(resolve => setTimeout(resolve, 50));

        // Unsubscribe
        unsubscribe();

        // Publish second message (should not be received)
        client.publish({ topic: 'test.unsub', data: { n: 2 } });
        await new Promise(resolve => setTimeout(resolve, 50));

        return {
          count: messages.length,
          firstMessage: messages[0]?.data?.n
        };
      });

      expect(result.count).toBe(1);
      expect(result.firstMessage).toBe(1);
    });

    test('should auto-unsubscribe with AbortSignal', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();

        const messages = [];
        const controller = new AbortController();

        client.subscribe('test.abort', (msg) => {
          messages.push(msg);
        }, { signal: controller.signal });

        // Publish first message
        client.publish({ topic: 'test.abort', data: { n: 1 } });
        await new Promise(resolve => setTimeout(resolve, 50));

        // Abort subscription
        controller.abort();

        // Publish second message (should not be received)
        client.publish({ topic: 'test.abort', data: { n: 2 } });
        await new Promise(resolve => setTimeout(resolve, 50));

        return {
          count: messages.length,
          firstMessage: messages[0]?.data?.n
        };
      });

      expect(result.count).toBe(1);
      expect(result.firstMessage).toBe(1);
    });
  });

  test.describe('Request/Reply Pattern', () => {
    test('should send request and receive reply', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();

        // Set up responder
        client.subscribe('users.get', (msg) => {
          // Send reply
          client.publish({
            topic: msg.replyTo,
            data: { user: { id: msg.data.id, name: 'Alice' } },
            correlationId: msg.correlationId
          });
        });

        // Send request
        const response = await client.request('users.get', { id: 123 });

        return {
          userId: response.data.user.id,
          userName: response.data.user.name
        };
      });

      expect(result.userId).toBe(123);
      expect(result.userName).toBe('Alice');
    });

    test('should handle request timeout', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();

        // No responder - request will timeout
        try {
          await client.request('no.responder', { test: true }, { timeoutMs: 100 });
          return { timedOut: false };
        } catch (err) {
          return {
            timedOut: true,
            message: err.message
          };
        }
      });

      expect(result.timedOut).toBe(true);
      expect(result.message).toContain('timeout');
    });

    test('should handle multiple simultaneous requests', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();

        // Set up responder that echoes back the ID
        client.subscribe('echo.*', (msg) => {
          const id = msg.topic.split('.')[1];
          client.publish({
            topic: msg.replyTo,
            data: { echoed: id },
            correlationId: msg.correlationId
          });
        });

        // Send multiple requests simultaneously
        const [r1, r2, r3] = await Promise.all([
          client.request('echo.first', {}),
          client.request('echo.second', {}),
          client.request('echo.third', {})
        ]);

        return {
          first: r1.data.echoed,
          second: r2.data.echoed,
          third: r3.data.echoed
        };
      });

      expect(result.first).toBe('first');
      expect(result.second).toBe('second');
      expect(result.third).toBe('third');
    });
  });

  test.describe('Static matches() Method', () => {
    test('should match exact topics', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(() => {
        return {
          exact: window.PanClient.matches('users.list', 'users.list'),
          notExact: window.PanClient.matches('users.list', 'users.get')
        };
      });

      expect(result.exact).toBe(true);
      expect(result.notExact).toBe(false);
    });

    test('should match global wildcard', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(() => {
        return {
          users: window.PanClient.matches('users.list', '*'),
          posts: window.PanClient.matches('posts.created', '*'),
          nested: window.PanClient.matches('app.data.updated', '*')
        };
      });

      expect(result.users).toBe(true);
      expect(result.posts).toBe(true);
      expect(result.nested).toBe(true);
    });

    test('should match segment wildcards', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(() => {
        return {
          userCreated: window.PanClient.matches('users.created', 'users.*'),
          userUpdated: window.PanClient.matches('users.updated', 'users.*'),
          postCreated: window.PanClient.matches('posts.created', 'users.*'),
          nested: window.PanClient.matches('users.list.all', 'users.*')
        };
      });

      expect(result.userCreated).toBe(true);
      expect(result.userUpdated).toBe(true);
      expect(result.postCreated).toBe(false);
      expect(result.nested).toBe(false); // Wildcard only matches single segment
    });

    test('should match multi-segment wildcards', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(() => {
        return {
          match1: window.PanClient.matches('app.users.list', 'app.*.*'),
          match2: window.PanClient.matches('app.posts.created', 'app.*.*'),
          tooShort: window.PanClient.matches('app.users', 'app.*.*'),
          tooLong: window.PanClient.matches('app.users.list.all', 'app.*.*')
        };
      });

      expect(result.match1).toBe(true);
      expect(result.match2).toBe(true);
      expect(result.tooShort).toBe(false);
      expect(result.tooLong).toBe(false);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle subscription before bus ready', async ({ page, context }) => {
      // Create a new page to test initialization order
      const testPage = await context.newPage();

      try {
        await testPage.addInitScript(() => {
          window.messages = [];
        });

        await testPage.goto(fileUrl('tests/fixtures/pan-client-test.html'));
        await testPage.waitForFunction(() => window.__testReady === true);

        const result = await testPage.evaluate(async () => {
          // Create client immediately (before explicitly waiting for ready)
          const client = new window.PanClient();

          // Subscribe immediately
          client.subscribe('early.bird', (msg) => {
            window.messages.push(msg);
          });

          // Wait for ready
          await client.ready();

          // Now publish
          client.publish({ topic: 'early.bird', data: { test: true } });

          await new Promise(resolve => setTimeout(resolve, 100));

          return {
            received: window.messages.length > 0,
            data: window.messages[0]?.data
          };
        });

        expect(result.received).toBe(true);
        expect(result.data.test).toBe(true);
      } finally {
        await testPage.close();
      }
    });

    test('should handle publishing to non-existent topics', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/pan-client-test.html'));
      await page.waitForFunction(() => window.__testReady === true);

      const result = await page.evaluate(async () => {
        const client = new window.PanClient();
        await client.ready();

        // Publishing to topic with no subscribers should not error
        try {
          client.publish({ topic: 'nobody.listening', data: { test: true } });
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      });

      expect(result.success).toBe(true);
    });

    test('should handle multiple clients independently', async ({ page, context }) => {
      // Use a fresh page to avoid subscription state from previous tests
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-client-test.html'));
        await testPage.waitForFunction(() => window.__testReady === true);

        const result = await testPage.evaluate(async () => {
          const client1 = new window.PanClient();
          const client2 = new window.PanClient();

          await Promise.all([client1.ready(), client2.ready()]);

          const messages1 = [];
          const messages2 = [];

          // Each client subscribes to different topics
          client1.subscribe('client1.*', (msg) => {
            messages1.push(msg.topic);
          });

          client2.subscribe('client2.*', (msg) => {
            messages2.push(msg.topic);
          });

          // Publish to both topics
          client1.publish({ topic: 'client1.message', data: { from: 1 } });
          client2.publish({ topic: 'client2.message', data: { from: 2 } });

          await new Promise(resolve => setTimeout(resolve, 100));

          return {
            client1Count: messages1.length,
            client2Count: messages2.length,
            client1Messages: messages1,
            client2Messages: messages2
          };
        });

        // Each client should only receive their own messages
        expect(result.client1Count).toBe(1);
        expect(result.client2Count).toBe(1);
        expect(result.client1Messages[0]).toBe('client1.message');
        expect(result.client2Messages[0]).toBe('client2.message');
      } finally {
        await testPage.close();
      }
    });
  });
});
